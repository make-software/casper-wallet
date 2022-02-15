built from [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react)

![](src/assets/img/logo128.png)
# Signer 2

## Install
```shell
npm install
```

Grant an execution permissions for `safari_build.sh` file:
```shell
chmod +x safari_build.sh
```

## Run for dev
For Chrome browser
```shell
npm run start:chrome
```
For Firefox browser
```shell
npm run start:firefox
```
You can run both command parallel.

Then you can get extension directly in browser by links:
- http://127.0.0.1:3001/popup.html - for Chrome build
- http://127.0.0.1:3002/popup.html - for Firefox build

You can get all files by link `http://127.0.0.1:{port}/` also, where `port` depends on which process you need.

You can open built extension in browsers also

### How to add build to Chrome browser
For `Chrome` follow the instructions below:
1. Navigate to `chrome://extensions/` in Chrome browser
2. Install extension if it doesn't exists on a list
3. Look at thumbnail of CasperLabs Signer extension. Copy `ID` field value there.
4. Open new tab and fill the link `chrome-extension://{paste ID here}/popup.html`

TODO: Improve and simplify this process

### How to add build to Firefox browser
For `Firefox` follow the instructions below:
1. Navigate to `about:debugging#/runtime/this-firefox` in Firefox browser
2. Install extension if it doesn't exists on a list
3. Look at thumbnail of CasperLabs Signer extension. Copy `Internal UUID` field value there.
4. Open new tab and fill the link `moz-extension://{paste Internal UUID here}/popup.html`

TODO: Improve and simplify this process

### How to add build to Safari browser
Script `build:safari` add built extension to Safari browser automatically. 

[See instruction for details](#safari).

## How to build
### Chrome
```shell
npm run build:chrome
```
Then you can find a build in `build/chrome` folder.
For opening it in Chrome:
1. Go to `chrome://extensions/` in Chrome browser
2. Enable `Developer mode` (right top corner, at least for Chrome 98)
3. Click on `Load unpacked` button (left top corner)
4. Choice and open `build/chrome` folder

### Firefox
```shell
npm run build:firefox
```
Then you can find a build in `build/firefox` folder.
For opening it in Firefox:
1. Go to `about:debugging#/runtime/this-firefox` in Firefox browser
2. Click on `Load Temporary Add-on...` button.
3. Choice `build/firefox/manifest.json` file

### Safari
```shell
npm run build:safari
```
Then you can find extension in your Safari browser. Allow unsigned extensions If you couldn't find it:
1. Enable `Develop` menu: Safari -> Preferences -> Advanced -> Show Develop menu in menu bar
2. Go to `Develop` menu
3. Click on `Allow Unsigned Extensions`

After that go to Safari -> Preferences -> Extensions and you can see it there