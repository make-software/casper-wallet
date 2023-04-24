rm -rf build/safari

./scripts/build-xcode-project.sh

# Copy binary
mkdir ./build/safari
cp -R xcode-project/Casper\ Wallet/build/Release/Casper\ Wallet.app ./build/safari/Casper\ Wallet.app
