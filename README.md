# Casper Wallet

![signer logo](src/assets/img/logo128.png)

_Securely manage your CSPR tokens, interact with dapps and sign transactions with Casper Wallet, the Go-To self-custody wallet for the Casper blockchain._

---

## Integrate Casper Wallet Into Your App

The recommended way of integrating Casper Wallet into your app is through [CSPR.click](https://CSPR.click), which provides a combined integration of major wallets in the Casper ecosystem, all at once, without the burden of maintaining multiple integrations at the same time. Please head over to [the CSPR.click documentation](https://docs.cspr.click) to start.

## Testing Casper Wallet integration on **Casper Wallet Playground**

_Casper Wallet Playground is a React webapp created as a developer tool to help test integration with various features available in Casper Wallet._

### Access Casper Wallet Playground repo

Open <https://github.com/make-software/casper-wallet-playground>

Clone this repository and run following commands from the repo root folder.
_NOTE: Node.js LTS is required._

```shell
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
2. Double click on "Casper Wallet.app" file.
3. Follow instructions and enable Casper Wallet in opened Extensions Preferences window.
4. Open Safari and enable unsigned extensions. Extension should be available.

For more information please [follow the link](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension)

## Development setup

Working on any macOS or Linux machine with NodeJS LTS installed.

### Install dependencies

Clone this repository and run following commands from the repo root folder.
_NOTE: Node.js LTS is required._

```shell
npm install
```

### Grant script execution permissions for `scripts` folder

```shell
chmod +x scripts/*
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

Chrome:

```shell
npm run build:chrome
```

Firefox:

```shell
npm run build:firefox
```

Safari:

```shell
npm run build:safari
```

All at once:

```shell
npm run build:all
```

## E2E tests

Write tests into `e2e-tests` folder.

To run e2e tests, you must use npm script `npm run e2e:chrome:ui:popup` or `e2e:chrome:ui:onboarding`.
Tests are run in UI mode.

All information
about how to run and debug tests can be found in [playwright docs](https://playwright.dev/docs/running-tests).
