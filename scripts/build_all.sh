HASH=$(git rev-parse --short HEAD)

npm run build:chrome && npm run build:firefox && cd ./build && zip -r casper-wallet-1.14.0#$HASH.zip ./* && npm run build:src
