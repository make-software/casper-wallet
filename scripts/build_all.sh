HASH=$(git rev-parse --short HEAD)

npm run build:chrome && npm run build:firefox && cd ./build && zip -r casper-wallet-2.4.0rc7#$HASH.zip ./* && npm run build:src
