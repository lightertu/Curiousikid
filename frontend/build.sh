#!/usr/bin/env bash

set -eux

auth() {
  ~/.toolbox/bin/ada credentials update --account=026090537351 --provider=conduit --role=IibsAdminAccess-DO-NOT-DELETE --once
  export AWS_DEFAULT_REGION='us-east-1'
}


clean() {
  rm -rf node_modules
}

release() {
  pnpm install
  pnpm dev
}


# Execute given command with remaining arguments, defaulting the command to release
if [[ $# -eq 0 ]]; then COMMAND="release"; else COMMAND="$1"; fi


echo "Running $COMMAND $@"

eval $COMMAND "$@"
