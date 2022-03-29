# Signer 2

built from [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react)

![signer logo](src/assets/img/logo128.png)

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

For Safari browser

```shell
npm run start:safari
```

You can run all these commands in parallel.

## How to build

### Chrome

```shell
npm run build:chrome
```

Then you can find a build in `build/chrome` folder.
For opening it in Chrome:

1. Navigate `chrome://extensions/` in Chrome browser
2. Enable `Developer mode` (right top corner, at least for Chrome 98)
3. Click on `Load unpacked` button (left top corner)
4. Choice and open `build/chrome` folder

### Firefox

```shell
npm run build:firefox
```

Then you can find a build in `build/firefox` folder.
For opening it in Firefox:

1. Navigate `about:debugging#/runtime/this-firefox` in Firefox browser
2. Click on `Load Temporary Add-on...` button.
3. Choice `build/firefox/manifest.json` file

After that go to Safari -> Preferences -> Extensions and you can see it there

### How to add build to Chrome browser

For `Chrome` follow the instructions below:

1. Navigate to `chrome://extensions/` in Chrome browser
2. [Install](#chrome) extension if it doesn't exists on a list
3. Find a thumbnail of CasperLabs Signer extension.
4. Copy `ID` field value there.
5. Open new tab and fill the link `chrome-extension://{paste ID here}/popup.html`

### How to add build to Firefox browser

For `Firefox` follow the instructions below:

1. Navigate to `about:debugging#/runtime/this-firefox` in Firefox browser
2. [Install](#firefox) extension if it doesn't exists on a list
3. Find a thumbnail of CasperLabs Signer extension.
4. Copy `Internal UUID` field value there.
5. Open new tab and fill the link `moz-extension://{paste Internal UUID here}/popup.html`

## Safari

Build present in `build/safari` folder.
For more information please [follow the link](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension)
