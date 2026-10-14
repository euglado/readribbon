#!/usr/bin/env bash
set -eu
cd -- "$(dirname -- "$0")"
if [ ! -f dist/src/main.js ]; then
  printf '%s\n' 'Run bash setup.sh first / Önce bash setup.sh çalıştırın.' >&2
  exit 1
fi
npm start
