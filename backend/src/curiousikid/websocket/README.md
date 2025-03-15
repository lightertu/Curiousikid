# WebSocket Protocol Implementation

This directory contains the implementation of the WebSocket protocol for the Curiousikid backend, designed to communicate with the frontend player application.

## Protocol Overview

The WebSocket protocol is organized around typed messages, with each message having a `type` and a `payload`. This typed approach enables structured communication between the client and server.

### Core Components

- `message_types.py`: Defines all message types and their payload structures using Pydantic models
- `manager.py`: Implements the WebSocketManager class that handles connections and message routing
- `__init__.py`: Exports the main components for easy importing

## Message Flow

The typical message flow between client and server is:

1. **Connection**: Client connects to the WebSocket endpoint
2. **Handshake**: Client sends a `HANDSHAKE` message with its capabilities
3. **Handshake Response**: Server responds with a `HANDSHAKE_RESPONSE` containing session ID and supported features
4. **State Sync**: Client requests current state with `STATE_SYNC_REQUEST`
5. **State Response**: Server sends current application state with `STATE_SYNC_RESPONSE`
6. **Ongoing Communication**: Various messages for playback control, voice streaming, etc.

## Testing

You can test the WebSocket implementation using the provided test script:

```bash
# Start the server
cd /path/to/backend
python -m src.curiousikid.main

# In another terminal, run the test script
python test_websocket.py
```

## Message Types

The protocol supports the following message types:

### Connection Management
- `HANDSHAKE`: Initial client identification
- `HANDSHAKE_RESPONSE`: Server acknowledgment with session ID
- `CONNECTION_KEEP_ALIVE`: Periodic ping to keep connection active

### Playback Control
- `PLAYBACK_CONTROL`: Client requests to change playback state
- `PLAYBACK_STATE`: Updates current playback state

### Voice Communication
- `VOICE_STREAM_START`: Signal start of voice streaming
- `VOICE_STREAM_END`: Signal end of voice streaming
- `VOICE_DATA`: Binary voice data (transmitted as binary WebSocket messages)

### Application State
- `STATE_UPDATE`: Update a specific part of application state
- `STATE_SYNC_REQUEST`: Request full state sync
- `STATE_SYNC_RESPONSE`: Full state response

### Notifications/UI
- `NOTIFICATION`: Server-generated notification for UI
- `ERROR`: Error message from server

## Adding New Message Types

To add a new message type:

1. Add the type to the `MessageType` enum in `message_types.py`
2. Create Pydantic models for request/response payloads
3. Implement a handler method in `WebSocketManager` or register an external handler
4. Update frontend TypeScript definitions to match 