#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

HASH=$(git rev-parse --short HEAD)
VERSION=$(node -p "require('./package.json').version")

# The rc counter runs per version: bumping the version in package.json starts
# over at rc1, a rebuild of the same version continues after the highest
# archive already in build/. Clearing build/ therefore restarts the count.
last_rc=0
for archive in "build/casper-wallet-${VERSION}rc"*"#"*.zip; do
  [ -e "$archive" ] || continue
  rc=${archive#"build/casper-wallet-${VERSION}rc"}
  rc=${rc%%#*}
  case $rc in
    '' | *[!0-9]*) continue ;;
  esac
  if [ "$rc" -gt "$last_rc" ]; then
    last_rc=$rc
  fi
done

ARCHIVE="casper-wallet-${VERSION}rc$((last_rc + 1))#${HASH}.zip"

npm run build:chrome
npm run build:firefox
npm run build:safari

# Named explicitly, not `./*`: earlier archives stay in build/ to carry the rc
# counter, and zipping them into the new one would nest every past release.
# Safari is out on purpose — Xcode reads those resources straight from
# build/safari and ships them inside the app.
(cd ./build && zip -r "$ARCHIVE" chrome firefox)

npm run build:src

echo "Archive: build/$ARCHIVE"
