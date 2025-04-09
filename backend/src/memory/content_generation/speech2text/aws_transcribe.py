import asyncio
import uuid

import aioboto3
import aiohttp
import boto3
import s3fs

from environment import ENV

TRANSCRIBE_LANGUAGE_CODE = 'en-US'


class BatchSpeech2TextConverter:
    def __init__(self):
        # Initialize the Transcribe client
        self.transcribe_client = boto3.client('_transcribe')
        self.s3 = s3fs.S3FileSystem()

    def convert(self, job_name: str, media_url: str, bucket: str):
        return asyncio.run(converter.create_convert_job_async(job_name, media_url, bucket))

    async def create_convert_job_async(self,
                                       job_name: str,
                                       media_url: str,
                                       bucket: str,
                                       language_code: str = TRANSCRIBE_LANGUAGE_CODE):
        s3_path = await self.persist_file(url=media_url, bucket=bucket)
        session = aioboto3.Session()
        async with session.client('_transcribe') as transcribe_client:
            # Start transcription job
            response = await transcribe_client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={
                    'MediaFileUri': s3_path,
                },
                MediaFormat="mp3",
                LanguageCode=language_code
            )

            # Wait for the job to complete and return the response
            print(response)
            return response

    async def persist_file(self, url, bucket, chunk_size=1024 * 1024) -> str:
        # Open the destination file in S3 asynchronously
        upload_path = f"s3://{bucket}/podcasts/{uuid.uuid4()}/podcast.mp3"
        with self.s3.open(upload_path, 'wb') as s3_file:
            # Stream the file in chunks using aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        raise Exception(f"Failed to download file, status code: {response.status}")

                    # Stream and upload the file chunk by chunk
                    async for chunk in response.content.iter_chunked(chunk_size):
                        if chunk:  # Upload each chunk to S3
                            s3_file.write(chunk)

        return upload_path


if __name__ == '__main__':
    # Example usage
    job_name = 'my-transcription-job'
    media_url = 'https://dcs-spotify.megaphone.fm/SCIM6125190274.mp3?key=d4d1ae24f63212d2d67f0c8aa4397c3e&request_event_id=1f210cc0-01ef-466d-a7b3-54ae76fcc6ee&timetoken=1728613045_06A749E8E51F8A507F0903FA233A3D8B'  # Add the URL of your podcast audio file

    converter = BatchSpeech2TextConverter()

    # Step 1: Create Transcription Job
    converter.convert(job_name, media_url, ENV.S3_BUCKET)
