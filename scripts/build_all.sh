HASH=$(git rev-parse --short HEAD)

npm run build:chrome && npm run build:safari && cd ./build && zip -r casper-wallet#$HASH.zip ./* && npm run build:src
