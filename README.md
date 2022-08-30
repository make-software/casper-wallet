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

Any browser:

```shell
cd playground && npm run start
```

For Firefox browser

```shell
npm run start:firefox
```

For Safari browser

```shell
npm run start:safari
```

## Build for production

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

To open as a tab:

1. Open a new tab and use the link `chrome-extension://{paste ID here}/popup.html`

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

To open as a tab:

1. Open new tab and fill the link `moz-extension://{paste Internal UUID here}/popup.html`

### Safari

```shell
npm run build:safari
```

Build present in `build/safari` folder.
For more information please [follow the link](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension)

## E2E tests

Write tests into `e2e/tests` folder.

Use npm scripts `test:e2e:chrome` and `test:e2e:firefox` depends on target browser
