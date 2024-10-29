import boto3
import httpx
from fastapi import FastAPI, BackgroundTasks

from holdon.envionrment import ENV

app = FastAPI()
transcribe_client = boto3.client('_transcribe')

LISTEN_NOTES_API_KEY = "your_listen_notes_api_key"
API_URL = "https://listen-api.listennotes.com/api/v2/podcasts"


# Fetch podcast metadata from a third-party API
@app.get("/api/podcasts")
async def list_podcasts():
    return []


# Fetch podcast metadata from a third-party API
@app.get("/api/podcasts/{podcast_id}/metadata")
async def get_podcast_metadata(podcast_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_URL}/{podcast_id}",
            headers={ "X-ListenAPI-Key": LISTEN_NOTES_API_KEY })
        return response.json()


# Route to stream the audio both to the browser and Amazon Transcribe
@app.get("/api/podcasts/{podcast_id}/stream")
async def stream_podcast_audio(podcast_id: str,
                               background_tasks: BackgroundTasks):
    # Fetch the audio URL from the podcast metadata (replace with your logic)
    audio_url = "https://cdn.example.com/audio.mp3"  # Example URL

    # Background task to stream the podcast to Amazon Transcribe
    background_tasks.add_task(stream_to_transcribe, podcast_id, audio_url)

    async with httpx.AsyncClient() as client:
        async with client.stream("GET", audio_url) as audio_stream:
            async for chunk in audio_stream.aiter_bytes():
                # Send the audio to the user
                yield chunk


async def stream_to_transcribe(podcast_id: str, audio_url: str):
    # Start the transcription session
    transcription_job_name = f"transcription-{podcast_id}"

    # Here you would use AWS Transcribe Streaming WebSocket or HTTP2 connection
    transcribe_stream = transcribe_client.start_stream_transcription(
        LanguageCode='en-US',
        MediaSampleRateHertz=16000,  # Adjust according to your audio stream
        MediaEncoding='pcm'
    )

    async with httpx.AsyncClient() as client:
        async with client.stream("GET", audio_url) as audio_stream:
            # Buffer to store audio chunks and send them to Transcribe
            for chunk in audio_stream.aiter_bytes():
                # In this example, assume the chunk is in the correct format.
                # You might need to convert the chunk to PCM if required.
                # Send the chunk to Amazon Transcribe
                send_audio_chunk_to_transcribe(chunk, transcribe_stream)

    # Complete the transcription session
    transcribe_client.get_transcription_job(TranscriptionJobName=transcription_job_name)



def send_audio_chunk_to_transcribe(audio_chunk, transcribe_stream):
    # Send the audio chunk to Amazon Transcribe (modify this function as per AWS Transcribe Streaming API)
    try:
        transcribe_stream.send_audio_event(
            AudioStream=audio_chunk
        )
    except Exception as e:
        print(f"Error sending audio to Amazon Transcribe: {e}")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)