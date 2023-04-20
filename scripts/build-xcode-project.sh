# Building safari extension binary using XCode Project
cd ./xcode-project/Casper\ Wallet
xcodebuild -quiet -project Casper\ Wallet.xcodeproj -alltargets -configuration Release
cd ../..
