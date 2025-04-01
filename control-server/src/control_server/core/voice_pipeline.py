import logging
import boto3
from typing import Optional, Dict, Any, BinaryIO
import io
from botocore.response import StreamingBody
from typing import Union

logger = logging.getLogger(__name__)

class VoicePipeline:
    """
    Pipeline for voice-related operations including text-to-speech and speech-to-text.
    """
    
    def __init__(self):
        """Initialize voice pipeline with AWS clients."""
        self.polly_client = boto3.client('polly')
        self.transcribe_client = boto3.client('transcribe')
        
    def tts(self, 
            text: str, 
            voice_id: str = "Matthew", 
            output_format: str = "ogg_vorbis", 
            rate: str = "medium") -> StreamingBody:
        """
        Convert text to speech and return the AWS Polly audio stream directly.
        
        Args:
            text: Text to convert to speech
            voice_id: AWS Polly voice to use
            output_format: Audio format (mp3, ogg_vorbis, pcm)
            rate: Speaking rate (x-slow, slow, medium, fast, x-fast)
            
        Returns:
            StreamingBody: Direct stream from AWS Polly that can be iterated over
        """
        try:
            text_with_rate = f'<speak><prosody rate="{rate}">{text}</prosody></speak>'
            
            response = self.polly_client.synthesize_speech(
                Engine='neural',
                Text=text_with_rate,
                TextType='ssml',
                VoiceId=voice_id,
                OutputFormat=output_format
            )
            
            logger.info(f"Generated streaming response for text ({len(text)} chars)")
            return response['AudioStream']
        except Exception as e:
            logger.error(f"Error in TTS: {str(e)}")
            raise
    
    def stt(self, 
            audio: bytes, 
            language_code: str = "en-US",
            format: str = "mp3") -> str:
        """
        Convert speech to text using AWS Transcribe's StartMedicalStreamTranscription API.
        This method doesn't require S3 and works directly with byte data.
        
        Args:
            audio: Audio data as bytes
            language_code: Language code for transcription
            format: Audio format (mp3, wav, etc.)
            
        Returns:
            Transcribed text as string
        """
        try:
            # Initialize with streaming client if needed
            if not hasattr(self, 'transcribe_streaming'):
                self.transcribe_streaming = boto3.client('transcribe')
            
            # Convert bytes to a stream
            audio_stream = io.BytesIO(audio)
            
            # Call the streaming transcribe API
            logger.info(f"Starting direct transcription for {len(audio)} bytes")
            
            # Use transactions list to collect results
            transcription_results = []
            
            # Start the stream
            response_stream = self.transcribe_streaming.start_stream_transcription(
                LanguageCode=language_code,
                MediaSampleRateHertz=44100,  # Adjust based on your audio
                MediaEncoding=format.upper(),
                AudioStream=audio_stream
            )
            
            # Process the stream results
            for event in response_stream['TranscriptResultStream']:
                if 'TranscriptEvent' in event:
                    results = event['TranscriptEvent']['Transcript']['Results']
                    for result in results:
                        if not result['IsPartial']:
                            for alt in result['Alternatives']:
                                transcription_results.append(alt['Transcript'])
            
            # Combine results
            full_transcript = ' '.join(transcription_results)
            
            logger.info(f"Direct transcription completed: {len(full_transcript)} chars")
            return full_transcript
            
        except Exception as e:
            logger.error(f"Error in direct speech-to-text conversion: {str(e)}")
            raise
    