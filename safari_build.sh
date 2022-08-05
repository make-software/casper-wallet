# Create Framework for build
xcrun safari-web-extension-converter --no-prompt --no-open --project-location ./build/xcode-framework --macos-only ./build/firefox

# Build
cd ./build/xcode-framework/CasperLabs\ Signer && xcodebuild -quiet -scheme CasperLabs\ Signer -derivedDataPath ../../safari/CasperLabs\ Signer

# Remove Framework
cd ../../ && rm -rf ./xcode-framework

# Add link to app file in root folder
cd ./safari && ln -s ./CasperLabs\ Signer/Build/Products/Debug/CasperLabs\ Signer.app Install\ extension\ to\ Safari