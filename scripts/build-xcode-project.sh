# Building safari extension binary using XCode Project
cd ./.xcode-project/Casper\ Wallet
xcodebuild -quiet -scheme Casper\ Wallet -derivedDataPath ../Output
cd ../..
