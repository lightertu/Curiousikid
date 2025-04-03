#!/usr/bin/env python3
"""
WebSocket client to test protocol communication with the backend.
Implements the handshake protocol and basic message handling.
"""

import asyncio
import json
import time
import uuid
import websockets

async def test_protocol():
    """Test the WebSocket protocol with handshake."""
    uri = "ws://localhost:8000/ws"
    
    print(f"Connecting to {uri}...")
    async with websockets.connect(uri) as websocket:
        print("Connected!")
        
        # Send handshake message
        handshake = {
            "type": "HANDSHAKE",
            "payload": {
                "client": "test-client",
                "version": "1.0.0",
                "capabilities": ["audio-streaming", "voice-input", "playback-control"]
            }
        }
        
        print(f"Sending handshake: {json.dumps(handshake, indent=2)}")
        await websocket.send(json.dumps(handshake))
        
        # Wait for handshake response
        response = await websocket.recv()
        response_data = json.loads(response)
        print(f"Received: {json.dumps(response_data, indent=2)}")
        
        if response_data["type"] == "HANDSHAKE_RESPONSE":
            session_id = response_data["payload"]["sessionId"]
            print(f"Handshake successful! Session ID: {session_id}")
            
            # Send state sync request
            state_sync_request = {
                "type": "STATE_SYNC_REQUEST",
                "payload": {
                    "clientTime": int(time.time() * 1000)
                }
            }
            
            print(f"Sending state sync request: {json.dumps(state_sync_request, indent=2)}")
            await websocket.send(json.dumps(state_sync_request))
            
            # Wait for state sync response
            response = await websocket.recv()
            response_data = json.loads(response)
            print(f"Received: {json.dumps(response_data, indent=2)}")
            
            # Test playback state update
            playback_state = {
                "type": "PLAYBACK_STATE",
                "payload": {
                    "isPlaying": True,
                    "currentTrack": {
                        "id": str(uuid.uuid4()),
                        "position": 30.5,
                        "duration": 180.0
                    }
                }
            }
            
            print(f"Sending playback state: {json.dumps(playback_state, indent=2)}")
            await websocket.send(json.dumps(playback_state))
            
            # Wait for a moment to see responses
            print("Waiting for 2 seconds...")
            await asyncio.sleep(2)
            
            # Test voice stream start (just the signaling, not actual audio)
            voice_start = {
                "type": "VOICE_STREAM_START",
                "payload": {
                    "format": "audio/webm;codecs=opus",
                    "sampleRate": 44100,
                    "channels": 1
                }
            }
            
            print(f"Sending voice stream start: {json.dumps(voice_start, indent=2)}")
            await websocket.send(json.dumps(voice_start))
            
            # Wait for notification response
            response = await websocket.recv()
            response_data = json.loads(response)
            print(f"Received: {json.dumps(response_data, indent=2)}")
            
            # End voice stream
            voice_end = {
                "type": "VOICE_STREAM_END",
                "payload": {
                    "timestamp": int(time.time() * 1000)
                }
            }
            
            print(f"Sending voice stream end: {json.dumps(voice_end, indent=2)}")
            await websocket.send(json.dumps(voice_end))
            
            # Wait a bit before disconnecting
            print("Waiting for 1 second before disconnecting...")
            await asyncio.sleep(1)
        else:
            print("Failed to complete handshake")


if __name__ == "__main__":
    asyncio.run(test_protocol()) 