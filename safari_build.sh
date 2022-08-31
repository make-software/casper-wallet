rm -rf ./build/safari
# Converting Firefox build folder into a Xcode Project
# Firefox extension is built on manifest V2, the same version Safari required
xcrun safari-web-extension-converter --no-prompt --no-open --project-location ./build/safari/xcode-project --macos-only ./build/firefox

# Building safari extension binary using XCode Project
cd ./build/safari/xcode-project/Casper\ Wallet
xcodebuild -quiet -scheme Casper\ Wallet -derivedDataPath ../../output

# Copy and Cleanup
cd ../../
cp -r ./output/Build/Products/Debug ./Casper\ Wallet
rm -rf ./xcode-project ./output

# Add link to app file in root folder
rm ./Double\ Click\ to\ Install
ln -s ./Casper\ Wallet/Casper\ Wallet.app Double\ Click\ to\ Install
