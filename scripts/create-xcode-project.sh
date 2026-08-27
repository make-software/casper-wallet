# Converting the Safari build folder into a Xcode Project.
# It carries manifest V2 (src/manifest.v2.safari.json), the version Safari requires.
xcrun safari-web-extension-converter ./build/safari --project-location xcode-project --bundle-identifier software.make.Casper-Wallet --macos-only --no-open --no-prompt
