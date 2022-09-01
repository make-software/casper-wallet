# Converting Firefox build folder into a Xcode Project
# Firefox extension is built on manifest V2, the same version Safari required
xcrun safari-web-extension-converter --no-prompt --no-open --project-location ./.xcode-project --macos-only ./build/firefox
