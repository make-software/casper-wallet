# Signer 2

built from [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react)

![signer logo](src/assets/img/logo128.png)

## Testing Casper Wallet integration with dApps (**Casper Wallet Playground**)

*Casper Wallet Playground is a React webapp created as a developer tool to help test integration with various features available in Casper Wallet.*

### Run Casper Wallet Playground site

Clone this repository and run following commands from the repo root folder.
*NOTE: Node.js LTS is required.*

```shell
cd playground
npm install
npm run start
```

This will open webapp automatically in a new tab.

### Load Wallet Extension in Chrome

1. Navigate `chrome://extensions/` in Chrome browser
2. Enable `Developer mode` (right top corner, at least for Chrome 98)
3. Click on `Load unpacked` button (left top corner)
4. Pick `build/chrome` folder from `builds.zip` deliverable or `builds` folder when building from sources.

To open as a tab:

1. Open a new tab and use the link `chrome-extension://{paste ID here}/popup.html`

### Load Wallet Extension in Firefox

1. Navigate `about:debugging#/runtime/this-firefox` in Firefox browser
2. Click on `Load Temporary Add-on...` button.
3. Pick `build/firefox/manifest.json` file from `builds.zip` deliverable or `builds` folder when building from sources.

To open as a tab:

1. Open new tab and fill the link `moz-extension://{paste Internal UUID here}/popup.html`

### Load Wallet Extension in Safari

1. Open `build/safari` folder from `builds.zip` or `builds` folder when building from sources.
2. Double click on "Doble Click to Install" file.
3. Follow instructions and enable Casper Wallet in opened Extensions Preferences window.
4. Open Safari and enable unsigned extensions. Extension should be available.

For more information please [follow the link](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension)

## Development setup

### Install dependencies

Clone this repository and run following commands from the repo root folder.
*NOTE: Node.js LTS is required.*

```shell
npm install
```

### Grant script execution permissions for `safari_build.sh` file

```shell
chmod +x safari_build.sh
```

### Start watcher script to rebuild on changes (`output` folder)

Chrome:

```shell
npm run start:chrome
```

Firefox:

```shell
npm run start:firefox
```

Safari:

```shell
npm run start:safari
```

You can run all these commands in parallel.

### Build deliverable from sources (`build` folder)

```shell
npm run build:all
```

## E2E tests

Write tests into `e2e/tests` folder.

Use npm scripts `test:e2e:chrome` and `test:e2e:firefox` depends on target browser
