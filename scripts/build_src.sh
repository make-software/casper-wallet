#!/usr/bin/env bash
set -euo pipefail

# Every path below is repo-relative, and build_all.sh invokes this after a `cd`.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

HASH=$(git rev-parse HEAD)

# The zip below carries no `.git`, so on the tree a reviewer unpacks the build
# scripts' `HASH=$(git rev-parse HEAD)` resolves empty. Ship the commit as a file
# so the rebuilt manifest.version_name matches the uploaded artifact instead of
# drifting to a placeholder. Read back by utils/commit-hash.js.
#
# Removed on the way out: left behind in a checkout it would outlive the commit
# it names, and quietly stamp that stale sha onto any later build that runs
# without HASH set.
trap 'rm -f build-hash.json' EXIT
printf '{\n  "commitHash": "%s"\n}\n' "$HASH" > build-hash.json

# `*.*` already covers build-hash.json; naming it keeps the dependency visible.
zip -r "casper-wallet-src#${HASH:0:7}.zip" src scripts utils *.* .env build-hash.json

mkdir -p build
mv "casper-wallet-src#${HASH:0:7}.zip" build/
