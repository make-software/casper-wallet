#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

XCODEPROJ="xcode-project/Casper Wallet/Casper Wallet.xcodeproj"
PBXPROJ="$XCODEPROJ/project.pbxproj"
SCHEME="Casper Wallet"
ENV_FILE="${SAFARI_RELEASE_ENV:-.env.release}"

upload=1
for arg in "$@"; do
  case $arg in
    --no-upload) upload=0 ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: $0 [--no-upload]" >&2
      exit 1
      ;;
  esac
done

# `.env` is not the place for these: build_src.sh copies it by name into the
# source package handed to store reviewers, so anything in it ships to Apple.
if [ -f .env ] && grep -q '^[[:space:]]*\(export[[:space:]]\)\?ASC_' .env; then
  echo "Move the ASC_* values out of .env and into $ENV_FILE." >&2
  echo ".env is bundled into the source-review package by 'npm run build:src'." >&2
  exit 1
fi

# Whatever is already exported wins, so a one-off key can be passed on the
# command line without editing the file.
key_path_from_env=${ASC_KEY_PATH:-}
key_id_from_env=${ASC_KEY_ID:-}
issuer_from_env=${ASC_ISSUER_ID:-}
team_from_env=${ASC_TEAM_ID:-}

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

ASC_KEY_PATH=${key_path_from_env:-${ASC_KEY_PATH:-}}
ASC_KEY_ID=${key_id_from_env:-${ASC_KEY_ID:-}}
ASC_ISSUER_ID=${issuer_from_env:-${ASC_ISSUER_ID:-}}
ASC_TEAM_ID=${team_from_env:-${ASC_TEAM_ID:-}}

missing=""
for var in ASC_KEY_PATH ASC_KEY_ID ASC_ISSUER_ID ASC_TEAM_ID; do
  if [ -z "${!var:-}" ]; then
    missing="$missing $var"
  fi
done
if [ -n "$missing" ]; then
  cat >&2 <<EOF
Missing:$missing

Put them in $ENV_FILE (gitignored) or export them:

  ASC_KEY_PATH=~/.appstoreconnect/private_keys/AuthKey_XXXXXXXXXX.p8
  ASC_KEY_ID=XXXXXXXXXX
  ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ASC_TEAM_ID=XXXXXXXXXX

The .p8 key itself is a credential: keep it outside the repository.
EOF
  exit 1
fi

# xcodebuild rejects a relative -authenticationKeyPath.
case $ASC_KEY_PATH in
  /*) ;;
  *) ASC_KEY_PATH="$PWD/$ASC_KEY_PATH" ;;
esac
if [ ! -f "$ASC_KEY_PATH" ]; then
  echo "No App Store Connect key at $ASC_KEY_PATH" >&2
  exit 1
fi

VERSION=$(node -p "require('./package.json').version")

# MARKETING_VERSION must be one to three dot-separated integers. A prerelease
# suffix in package.json would sail through the build and be rejected on upload,
# so it stops here instead.
if ! printf '%s' "$VERSION" | grep -qE '^[0-9]+(\.[0-9]+){0,2}$'; then
  echo "package.json version '$VERSION' is not a valid MARKETING_VERSION" >&2
  exit 1
fi

# The four CURRENT_PROJECT_VERSION entries (Debug/Release x app/extension) are
# written as one value, so a split between them means someone edited the project
# by hand and there is no single number to increment from.
current_builds=$(sed -n 's/^[[:space:]]*CURRENT_PROJECT_VERSION = \(.*\);$/\1/p' "$PBXPROJ" | sort -u)
if [ "$(printf '%s\n' "$current_builds" | wc -l | tr -d ' ')" -ne 1 ]; then
  echo "CURRENT_PROJECT_VERSION differs across build configurations:" >&2
  printf '  %s\n' $current_builds >&2
  exit 1
fi

BUILD="${SAFARI_BUILD:-$((current_builds + 1))}"

echo "Casper Wallet $VERSION ($BUILD)"

npm run build:safari

WORK_DIR=$(mktemp -d)
EXPORT_PLIST="$WORK_DIR/ExportOptions.plist"
PBXPROJ_BACKUP="$WORK_DIR/project.pbxproj"
cp "$PBXPROJ" "$PBXPROJ_BACKUP"

# A failed archive or upload leaves the bumped build number behind otherwise, and
# the next run would increment from a number that never reached TestFlight.
cleanup() {
  status=$?
  if [ $status -ne 0 ]; then
    cp "$PBXPROJ_BACKUP" "$PBXPROJ"
    echo "Failed — restored the original build number in project.pbxproj" >&2
  elif [ "$upload" -eq 0 ]; then
    # A dry run ships nothing, so the number it used is still free.
    cp "$PBXPROJ_BACKUP" "$PBXPROJ"
  fi
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

sed -i '' \
  -e "s/^\([[:space:]]*\)CURRENT_PROJECT_VERSION = .*;\$/\1CURRENT_PROJECT_VERSION = $BUILD;/" \
  -e "s/^\([[:space:]]*\)MARKETING_VERSION = .*;\$/\1MARKETING_VERSION = $VERSION;/" \
  "$PBXPROJ"

if [ "$upload" -eq 1 ]; then
  destination=upload
else
  destination=export
fi

cat > "$EXPORT_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>app-store-connect</string>
	<key>destination</key>
	<string>$destination</string>
	<key>teamID</key>
	<string>$ASC_TEAM_ID</string>
</dict>
</plist>
EOF

ARCHIVE="build/safari-app/CasperWallet-${VERSION}-${BUILD}.xcarchive"
EXPORT_DIR="build/safari-app/CasperWallet-${VERSION}-${BUILD}"
rm -rf "$ARCHIVE" "$EXPORT_DIR"

# DEVELOPMENT_TEAM is deliberately absent from the project: passing it here keeps
# the only tracked edits to this file the two version lines above.
xcodebuild archive \
  -project "$XCODEPROJ" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination 'generic/platform=macOS' \
  -archivePath "$ARCHIVE" \
  DEVELOPMENT_TEAM="$ASC_TEAM_ID" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$ASC_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$ASC_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"

echo
if [ "$upload" -eq 1 ]; then
  cat <<EOF
Uploaded build $BUILD of $VERSION. It appears in TestFlight once App Store
Connect finishes processing it.

The build number now lives in the working tree. Commit it so the next release
increments from a number that was actually shipped:

  git commit -o "$PBXPROJ" -m "build(safari): bump to $VERSION ($BUILD)"
EOF
else
  cat <<EOF
Exported to $EXPORT_DIR (not uploaded).

Build $BUILD went nowhere, so project.pbxproj keeps the number it had; the next
release still gets $BUILD.
EOF
fi
