rm -rf build/safari

./scripts/create-xcode-project.sh
./scripts/build-xcode-project.sh

# Copy binary
mkdir ./build/safari
cp -R ./.xcode-project/Output/Build/Products/Debug/Casper\ Wallet.app ./build/safari/Casper\ Wallet.app
