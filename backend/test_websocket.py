#!/usr/bin/env python3
"""
Simple WebSocket client to test the WebSocket endpoint of our FastAPI server.
Run this script in a separate terminal while the server is running.
"""

import asyncio
import json
import websockets

async def hello():
    uri = "ws://localhost:8000/ws"
    async with websockets.connect(uri) as websocket:
        # Receive the welcome message
        response = await websocket.recv()
        print(f"Welcome message: {response}")
        
        # Send a test event
        test_event = {
            "event_type": "TEST_EVENT",
            "data": {
                "message": "This is a test event"
            }
        }
        await websocket.send(json.dumps(test_event))
        print(f"Sent: {json.dumps(test_event)}")
        
        # Receive the response action
        response = await websocket.recv()
        print(f"Received: {response}")
        
        # Wait a bit before closing
        await asyncio.sleep(1)

asyncio.run(hello()) 