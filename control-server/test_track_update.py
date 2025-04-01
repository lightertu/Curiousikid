#!/usr/bin/env python3
"""
Test script for sending track context updates via WebSocket.
"""

import asyncio
import json
import time
import uuid
import websockets

async def test_track_update():
    """Test sending track context updates via WebSocket."""
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
        
        # Generate a random track ID
        track_id = str(uuid.uuid4())
        
        # Simulate track playback and send updates
        for i in range(0, 100, 10):  # 0, 10, 20, ..., 90
            current_time = i
            duration = 100
            
            track_update = {
                "type": "UPDATE_TRACK_CONTEXT",
                "payload": {
                    "trackId": track_id,
                    "duration": float(duration),
                    "currentTime": float(current_time)
                }
            }
            
            print(f"Sending track update: {json.dumps(track_update, indent=2)}")
            await websocket.send(json.dumps(track_update))
            
            # Wait a moment before the next update
            await asyncio.sleep(1)
        
        # Wait a moment before disconnecting
        print("Waiting for 2 seconds before disconnecting...")
        await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(test_track_update()) 