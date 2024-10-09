#!/usr/bin/env bash

set -eux

local() {
  pnpm install --registry https://registry.npmjs.org/
}

# Execute given command with remaining arguments, defaulting the command to release
if [[ $# -eq 0 ]]; then COMMAND="release"; else COMMAND="$1"; fi


echo "Running $COMMAND $@"

eval $COMMAND "$@"
