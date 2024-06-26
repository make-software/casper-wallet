HASH=$(git rev-parse --short HEAD)

npm run build:chrome && npm run build:firefox && cd ./build && zip -r casper-wallet-1.11.0.rc5#$HASH.zip ./* && npm run build:src
