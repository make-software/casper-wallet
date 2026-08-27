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

RC=$((last_rc + 1))
STAMP="${VERSION}rc${RC}#${HASH}"

npm run build:chrome
npm run build:firefox
npm run build:safari

# Store uploads want the extension at the zip root, so each one is zipped from
# inside its own build dir. Dotfiles are dropped: a Finder visit leaves a
# .DS_Store behind, and the stores flag it.
for target in chrome firefox; do
  store_archive="casper-wallet-${target}-${STAMP}.zip"
  rm -f "build/$store_archive"
  (cd "./build/$target" && zip -qr -X "../$store_archive" . -x '.*' '*/.*')
  echo "Store archive: build/$store_archive"
done

# Named explicitly, not `./*`: the archives above and the ones from earlier runs
# live in build/ too, and `./*` would nest all of them into this one. Safari is
# out on purpose — Xcode reads those resources straight from build/safari and
# ships them inside the app.
rm -f "build/casper-wallet-${STAMP}.zip"
(cd ./build && zip -qr "casper-wallet-${STAMP}.zip" chrome firefox)

npm run build:src

echo "Archive: build/casper-wallet-${STAMP}.zip"
