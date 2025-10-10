HASH=$(git rev-parse --short HEAD)

zip -r casper-wallet-src#$HASH.zip src scripts utils *.* .env && mv casper-wallet-src#$HASH.zip build/
