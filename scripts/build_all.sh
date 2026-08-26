HASH=$(git rev-parse --short HEAD)

npm run build:chrome && npm run build:firefox && npm run build:safari && cd ./build && zip -r casper-wallet-2.7.0rc1#$HASH.zip ./* && npm run build:src
