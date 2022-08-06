# Deploying the XCode Framework for further assembly of extension by Webpack XcodeBuild plugin
# Firefox extension built on manifest V2, the same version Safari required, so we use the Firefox build as source for extension for Safari
xcrun safari-web-extension-converter --no-prompt --no-open --project-location ./output/safari --macos-only ./output/firefox