#! /usr/bin/env bash

set -eux

# Install just
pip install rust-just

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh