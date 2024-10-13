import ffmpeg
import whisper


class OfflineWhisperTranscriber:
    def __init__(self):
        self.model = whisper.load_model("base")

    def convert_mp3_to_wav(self, mp3_file: str, wav_file: str):
        # Convert MP3 file to WAV using moviepy
        (
            ffmpeg.input(mp3_file).output(wav_file).run()
        )

    def transcribe_with_timestamps(self, wav_file):
        # Transcribe the audio file with timestamps
        result = self.model.transcribe(wav_file, verbose=True)

        # Extract the segments with timestamps and text
        segments = result['segments']
        transcribed_text = ""

        for segment in segments:
            start_time = segment['start']  # Start time of the segment
            end_time = segment['end']  # End time of the segment
            text = segment['text']  # Text transcription of the segment

            # Add the transcription and timestamp
            transcribed_text += f"{text.strip()} [{start_time:.2f} - {end_time:.2f}]\n"

        return transcribed_text


if __name__ == '__main__':
    # Example usage
    mp3_file = '/Users/raytu/workspace/Holdon/backend/podcasts/hubermanlab/podcast.mp3'
    wav_file = '/Users/raytu/workspace/Holdon/backend/podcasts/hubermanlab/podcast.ogg'

    w = OfflineWhisperTranscriber()
    # Convert MP3 to WAV
    w.convert_mp3_to_wav(mp3_file, wav_file)

    # Get transcription with timestamps
    transcription = w.transcribe_with_timestamps(wav_file)

    # Save the transcription to a text file
    with open('transcription_with_timestamps.txt', 'w') as f:
        f.write(transcription)

    print("Transcription with timestamps saved to 'transcription_with_timestamps.txt'")
