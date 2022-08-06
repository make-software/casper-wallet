# Deploying the XCode Framework for building of extension for Safari
# Firefox extension built on manifest V2, the same version Safari required, so we use the Firefox build as source for extension for Safari
xcrun safari-web-extension-converter --no-prompt --no-open --project-location ./build/xcode-framework --macos-only ./build/firefox

# Building extension for Safari by XCode Framework
cd ./build/xcode-framework/CasperLabs\ Signer && xcodebuild -quiet -scheme CasperLabs\ Signer -derivedDataPath ../../safari/CasperLabs\ Signer

# Remove XCode Framework
cd ../../ && rm -rf ./xcode-framework

# Add link to app file in root folder
cd ./safari && ln -s ./CasperLabs\ Signer/Build/Products/Debug/CasperLabs\ Signer.app Install\ extension\ to\ Safari