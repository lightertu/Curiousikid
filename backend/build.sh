#!/usr/bin/env bash

set -eux

auth() {
  ~/.toolbox/bin/ada credentials update --account=026090537351 --provider=conduit --role=IibsAdminAccess-DO-NOT-DELETE --once
  export AWS_DEFAULT_REGION='us-east-1'
}

clean() {
  rm -rf .venv
}

release() {
  source .venv/bin/activate
  poetry install
}

mac_setup() {
  # Install pyenv
  brew update
  brew install pyenv

  # Install poetry
  brew install pipx
  pipx ensurepath
  pipx install poetry 
}

run_agent() {
  .venv/bin/python src/holdon/agent/entrypoint.py dev
}

# Execute given command with remaining arguments, defaulting the command to release
if [[ $# -eq 0 ]]; then COMMAND="release"; else COMMAND="$1"; fi


echo "Running $COMMAND $@"

eval $COMMAND "$@"
