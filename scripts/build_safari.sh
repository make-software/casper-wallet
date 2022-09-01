rm -rf ./build/safari

./scripts/create-xcode-project.sh
./scripts/build-xcode-project.sh

# Copy binary
cp -r ./.xcode-project/Output/Build/Products/Debug ./build/safari
