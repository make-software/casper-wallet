# Converting Firefox build folder into a Xcode Project
# Firefox extension is built on manifest V2, the same version Safari required
xcrun safari-web-extension-converter ./build/firefox --project-location xcode-project --bundle-identifier software.make.Casper-Wallet --macos-only --no-open --no-prompt
