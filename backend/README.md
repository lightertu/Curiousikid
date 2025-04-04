# Curiousikid Backend
A AI Application allow you to chat with podcast host while listening to podcast

## Setup Instance
Run `bash ./setup.sh`

## Setup Virtual Environment
Run `just install`

## Code Structure
```
├── ...
├── justfile               # <- Put your common commands there
├── src
│   ├── control_server     # <- Websocket layer to control the device
│   ├── environment        # <- All global configurations via environment variables
│   ├── memory             # <- The shared storage layer between control_server and voice_agent
│   └── voice_agent        # <- Livekit voice agent implementation that uses the storage layer
└── pyproject.toml         # <- You can use `uv add {MY_PACKAGE_NAME}` on CLI to add new dependencies there.
```