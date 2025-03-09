import argparse
import asyncio
import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import aiohttp
import ffmpeg
import torch
import whisper
import yaml
from tqdm import tqdm


# Detect the number of GPUs

class PodcastTranscriber:

    def __init__(self,
                 manifest: str,
                 output_dir: str,
                 model_name: str = "turbo"):
        self.manifest = manifest
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.model_name = model_name
        self.NUM_GPUS = torch.cuda.device_count()
        # Load YAML file
        with open(self.manifest, 'r') as file:
            data = yaml.safe_load(file)

        self.podcasts = data['podcasts']
        print(f"Number of GPUs available: {self.NUM_GPUS}")

    def _get_podcast_folder(self, podcast):
        podcast_dir = self.output_dir / podcast['id']
        if not podcast_dir.exists():
            podcast_dir.mkdir(parents=True, exist_ok=True)

        return podcast_dir

    def get_mp3_file_path(self, podcast):
        podcast_dir = self._get_podcast_folder(podcast)
        mp3_filename = f"podcast.mp3"
        return podcast_dir / mp3_filename

    def get_wav_file_path(self, podcast):
        podcast_dir = self._get_podcast_folder(podcast)
        filename = f"podcast.wav"
        return podcast_dir / filename

    def get_raw_transcription_path(self, podcast):
        podcast_dir = self._get_podcast_folder(podcast)
        filename = f"transcription_raw.json"
        return podcast_dir / filename

    def get_processed_transcription_path(self, podcast):
        podcast_dir = self._get_podcast_folder(podcast)
        filename = f"transcription_processed.json"
        return podcast_dir / filename

    # Step 2: Download MP3 files in parallel
    async def _download_mp3(self, podcast, session):
        audio_url = podcast['audioUrl']
        mp3_path = self.get_mp3_file_path(podcast)

        if mp3_path.exists():
            print(f"MP3 already exists: {mp3_path}")
            return mp3_path

        try:
            async with session.get(audio_url) as response:
                if response.status == 200:
                    with open(mp3_path, 'wb') as f:
                        f.write(await response.read())
                    print(f"Downloaded MP3: {mp3_path}")
                    return mp3_path
                else:
                    print(f"Failed to download {audio_url}")
        except Exception as e:
            print(f"Error downloading {audio_url}: {e}")

    async def _download_all_mp3(self):
        async with aiohttp.ClientSession() as session:
            tasks = [self._download_mp3(podcast, session) for podcast in self.podcasts]
            await asyncio.gather(*tasks)

    # Step 3: Convert MP3 to WAV using multiprocessing
    def _convert_mp3_to_wav(self, podcast):
        mp3_path = self.get_mp3_file_path(podcast)
        wav_path = self.get_wav_file_path(podcast)
        print(f"Converting {mp3_path} to {wav_path}")

        if wav_path.exists():
            print(f"WAV already exists: {wav_path}")
            return wav_path

        ffmpeg.input(str(mp3_path)).output(str(wav_path)).run()
        print(f"Converted {mp3_path} to {wav_path}")

    def _convert_all_mp3_to_wav(self):
        with ProcessPoolExecutor() as executor:
            list(tqdm(executor.map(self._convert_mp3_to_wav, self.podcasts), total=len(self.podcasts)))

    # Step 4: Transcribe WAV files using local Whisper model
    def _transcribe_wav(self, podcast):
        # Assign a GPU to this process
        gpu_id = torch.multiprocessing.current_process()._identity[0] % self.NUM_GPUS
        device = f"cuda:{gpu_id}" if torch.cuda.is_available() else "cpu"

        wav_path = self.get_mp3_file_path(podcast)
        raw_json_path = self.get_raw_transcription_path(podcast)
        postprocessed_json_path = self.get_processed_transcription_path(podcast)

        if raw_json_path.exists():
            print(f"Transcription already exists: {raw_json_path}")
            return

        print(f"Transcribing {wav_path} on {device}...")
        model = whisper.load_model(name=self.model_name, device=device)
        result = model.transcribe(str(wav_path), verbose=True)

        with open(raw_json_path, 'w', encoding='utf-8') as f:
            f.write(f"{json.dumps(result, indent=4)}\n")
        print(f"Raw transcription saved: {raw_json_path}")

        merged_transcription = self.merge_transcription(result)
        with open(postprocessed_json_path, 'w', encoding='utf-8') as f:
            f.write(f"{json.dumps(merged_transcription, indent=4)}\n")
        print(f"Post processed transcription saved: {postprocessed_json_path}")

    def merge_transcription(self, result):
        merged_segments = []
        buffer = ""
        start_time = None
        end_time = None

        for segment in result['segments']:
            if start_time is None:  # set start time on the first line of each sentence
                start_time = segment['start']

            buffer += segment['text'] + " "  # append text with a space

            # Check if line text ends with a punctuation (could signal end of a sentence)
            if segment['text'].strip()[-1] in {'.', '?', '!', ','}:
                end_time = segment['end']  # update end time

                if segment['text'].strip()[-1] in {'.', '?', '!'}:
                    # If we have a sentence-ending punctuation, save the sentence
                    merged_segments.append({
                        'start': start_time,
                        'end': end_time,
                        'text': buffer.strip()
                    })
                    # Reset buffer and times for the next sentence
                    buffer = ""
                    start_time = None
                    end_time = None

        result['segments'] = merged_segments
        return result

    def _transcribe_all_wav(self):
        # Use ProcessPoolExecutor to utilize multiple CPUs and GPUs
        with ProcessPoolExecutor(max_workers=self.NUM_GPUS) as executor:
            list(tqdm(executor.map(self._transcribe_wav, self.podcasts), total=len(self.podcasts)))

    async def transcribe(self):
        print("Step 1: Downloading all MP3 files.")
        await self._download_all_mp3()

        print("Step 3: Converting MP3 to WAV...")
        self._convert_all_mp3_to_wav()

        print("Step 4: Transcribing WAV files...")
        self._transcribe_all_wav()



# Main function to orchestrate the steps
def main():
    parser = argparse.ArgumentParser(description="Convert MP3 to WAV and _transcribe with timestamps.")

    # Define arguments
    parser.add_argument('--podcasts-manifest', type=str, help="Path to the podcast manifest file")
    parser.add_argument('--output-dir', type=str, help="Path to the output WAV file")

    args = parser.parse_args()
    print("Step 1: Creating folders...")

    t = PodcastTranscriber(
        manifest=args.podcasts_manifest,
        output_dir=args.output_dir
    )

    asyncio.run(t.transcribe())

    print("All tasks completed.")

if __name__ == "__main__":
    main()
