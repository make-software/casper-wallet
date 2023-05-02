HASH=$(git rev-parse --short HEAD)

npm run build:chrome && npm run build:safari && npm run build:firefox && cd ./build && zip -r casper-wallet#$HASH.zip chrome firefox safari && npm run build:src
