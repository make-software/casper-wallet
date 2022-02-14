# Safari is required extension with manifest v2. So we can use Firefox's build for now

npm run build:firefox

xcrun safari-web-extension-converter --no-prompt --no-open ./build/firefox

cd CasperLabs\ Signer
xcodebuild -scheme CasperLabs\ Signer\ \(macOS\) build
cd ..

rm -rf CasperLabs\ Signer