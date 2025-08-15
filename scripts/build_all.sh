HASH=$(git rev-parse --short HEAD)

npm run build:chrome && npm run build:firefox && cd ./build && zip -r casper-wallet-2.2.0rc3#$HASH.zip ./* && npm run build:src
