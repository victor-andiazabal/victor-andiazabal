#!/bin/sh
# Starts Space Vigil on macOS or Linux. Run it with:  sh start-mac-linux.sh
# Installs the packages on the first run, then starts the app and opens the browser.

cd "$(dirname "$0")" || exit 1

# Double-clicked scripts can start with a short PATH; add the usual Node.js install locations.
PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"
export PATH

fail() {
  echo
  printf '%s\n' "$1"
  if [ -t 0 ]; then
    printf 'Press Enter to close this window. '
    read -r _
  fi
  exit 1
}

echo "Space Vigil"
echo "==========="
echo

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js is not installed, and Space Vigil needs it to run on your computer.

1. Go to https://nodejs.org and download the LTS version.
2. Install it with the default options.
3. Run this script again.

Tip: you can also use the live version with nothing to install:
https://victor-andiazabal.github.io/victor-andiazabal/"
fi

# Vite needs Node 20.19 or newer on 20, or 22.12 or newer.
if ! node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=12)||(a===20&&b>=19)?0:1)"; then
  fail "Your Node.js is too old ($(node -v)). Space Vigil needs version 20.19 or newer, or 22.12 or newer.

Go to https://nodejs.org, download the LTS version, install it, then run this script again."
fi

if [ ! -f node_modules/vite/package.json ]; then
  echo "First run: installing the app's packages. This needs internet and takes a minute or two."
  echo
  npm install || fail "npm install failed. Check your internet connection and run this script again.
If it keeps failing, delete the node_modules folder and try once more."
fi

echo
echo "Starting Space Vigil. Your browser will open in a moment."
echo "If it does not, open the address shown below (usually http://localhost:5173)."
echo "Keep this window open while you use the app. Press Ctrl+C to stop."
echo

npm start || fail "Space Vigil stopped with an error. The messages above say what."
