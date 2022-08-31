# Signer 2

built from [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react)

![signer logo](src/assets/img/logo128.png)

## Development environment setup

Install dependencies:

```shell
npm install
```

Grant script execution permissions for `safari_build.sh` file:

```shell
chmod +x safari_build.sh
```

Open extension in Chrome browser:

```shell
npm run start:chrome
```

Open extension in Firefox browser:

```shell
npm run start:firefox
```

Open extension in Safari browser:

```shell
npm run start:safari
```

You can run all these commands in parallel.

## For Testers

Install dependencies:

```shell
npm install
```

Run Playground integration App:

```shell
cd playground && npm run start
```

### Chrome

Open `build/chrome` folder from `builds.zip`.
For opening it in Chrome:

1. Navigate `chrome://extensions/` in Chrome browser
2. Enable `Developer mode` (right top corner, at least for Chrome 98)
3. Click on `Load unpacked` button (left top corner)
4. Pick `build/chrome` folder from `builds.zip` deliverable.

To open as a tab:

1. Open a new tab and use the link `chrome-extension://{paste ID here}/popup.html`

### Firefox

1. Navigate `about:debugging#/runtime/this-firefox` in Firefox browser
2. Click on `Load Temporary Add-on...` button.
3. Pick `build/firefox/manifest.json` file from `builds.zip` deliverable.

To open as a tab:

1. Open new tab and fill the link `moz-extension://{paste Internal UUID here}/popup.html`

### Safari

1. Open `build/safari` folder from `builds.zip`.
2. Double click on "Doble Click to Install" file.
3. Follow instructions and enable Casper Wallet in opened Extensions Preferences window.
4. Open Safari and enable unsigned extensions. Extension should be available.

For more information please [follow the link](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension)

## Build for production

```shell
npm run build:all
```

## E2E tests

Write tests into `e2e/tests` folder.

Use npm scripts `test:e2e:chrome` and `test:e2e:firefox` depends on target browser
