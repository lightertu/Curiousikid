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
  poetry install
  source .venv/bin/activate
}

download_podcasts() {
  curl -o ./podcasts/SCIM6456251481.mp3 https://dcs-spotify.megaphone.fm/SCIM6456251481.mp3?key=35e96ab6e76366104fc4100b969a39d5&request_event_id=ca383c29-36f0-4abd-9fb9-ac24dc64ca9f&timetoken=1728844385_528C76F0658DC9C55E80F982FFC903B3
}

ec2_setup() {
  curl https://pyenv.run | bash
  python3 -m pip install --user pipx
  python3 -m pipx ensurepath --force
  python3 -m pip install --user --upgrade pipx
  pipx install poetry
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

sync() {
  LOCAL_DIR=$(pwd)
  PRIVATE_KEY="~/.ssh/samantha-ec2.pem"
  REMOTE_USER="ubuntu"
  REMOTE_HOSTNAME="ec2-18-215-251-169.compute-1.amazonaws.com"
  REMOTE_DIR="/home/$REMOTE_USER/workspace/Holdon"

  grep -v '^#' ".gitignore" | grep -v '^$' > ".syncignore"

  fswatch -o "$LOCAL_DIR" | while read; do
    rsync -avz --delete \
    -e "ssh -i $PRIVATE_KEY" \
    --exclude-from='.syncignore' $LOCAL_DIR \
    $REMOTE_USER@$REMOTE_HOSTNAME:$REMOTE_DIR
  done
}

# Execute given command with remaining arguments, defaulting the command to release
if [[ $# -eq 0 ]]; then COMMAND="release"; else COMMAND="$1"; fi


echo "Running $COMMAND $@"

eval $COMMAND "$@"
