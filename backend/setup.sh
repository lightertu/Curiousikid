#! /usr/bin/env bash

set -eux

# Install just
pip install rust-just

brew install pyenv
brew install livekit
brew install ffmpeg
brew install uv

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install LiveKit
curl -sSL https://get.livekit.io | bash
