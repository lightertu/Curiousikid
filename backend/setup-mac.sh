#! /usr/bin/env zsh

set -eux

# Install xcode
xcode-select --install

# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew upgrade

# Install Python dependencies
brew install openssl readline sqlite3 xz zlib tcl-tk@8 libb2
brew install pyenv
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init - zsh)"' >> ~/.zshrc

# Install just, livekit, ffmpeg, uv
brew install just livekit ffmpeg uv

exec $SHELL