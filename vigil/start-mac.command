#!/bin/sh
# Double-click this file on macOS to start Space Vigil. It runs start-mac-linux.sh from its own folder.
# If macOS blocks it, right-click the file, choose Open, then Open again.
cd "$(dirname "$0")" || exit 1
sh ./start-mac-linux.sh
