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

The Safari build is distributed through TestFlight — install it from there,
then follow steps 3-4 below.

To run it from sources instead:

1. Run `npm run build:safari` to produce the web-extension resources in `build/safari`.
2. Open `xcode-project/Casper Wallet/Casper Wallet.xcodeproj` and run the "Casper Wallet" scheme.
3. Follow instructions and enable Casper Wallet in opened Extensions Preferences window.
4. Open Safari and enable unsigned extensions. Extension should be available.

For more information please [follow the link](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension)

## Development setup

Working on any macOS or Linux machine with Node.js 22 and npm 10+ installed (see `.nvmrc` for the exact version). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` from the repo root to pick up the right version.

### Install dependencies

Clone this repository and run the following command from the repo root folder.

```shell
npm run setup
```

npm lifecycle scripts are disabled by default (`.npmrc` sets `ignore-scripts=true`)
as a supply-chain safeguard, so a plain `npm install` runs **no** dependency
install scripts and does **not** set up the git hooks. `npm run setup` performs a
full install: `npm ci`, then runs the approved install scripts via
`@lavamoat/allow-scripts`, then installs the git hooks.

Approved dependency install scripts live in the `lavamoat.allowScripts` allowlist
in `package.json`. To add a dependency that ships an install script, run
`npx allow-scripts auto`, then review the diff and set the new entry to `true`
only if the script is trusted and required — otherwise leave it `false`. CI fails
on any install script that is not explicitly configured.

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

You can run both of these commands in parallel. Safari has no watch mode —
build it with `npm run build:safari` and run the app from Xcode.

### Build deliverable from sources (`build` folder)

Chrome:

```shell
npm run build:chrome
```

Firefox:

```shell
npm run build:firefox
```

Safari (web-extension resources only — see below):

```shell
npm run build:safari
```

All at once:

```shell
npm run build:all
```

For Safari both commands stop at the web-extension resources in `build/safari`.
The app around them is built and submitted to TestFlight from
`xcode-project/Casper Wallet` in Xcode; there is no npm script for that step,
and the resources are not part of the archive below — Xcode reads them from
`build/safari` directly.

`build:all` bundles the Chrome and Firefox builds into
`build/casper-wallet-<version>rc<n>#<sha>.zip`, taking `<version>` from
`package.json`. The rc number restarts at 1 whenever that version changes and
otherwise continues from the highest archive already sitting in `build/` — so
keep the previous archives there if you want the count to carry on.

Alongside it come `build/casper-wallet-chrome-<version>rc<n>#<sha>.zip` and its
`firefox` counterpart, ready to upload to the stores as they are: each holds
the extension at the zip root, which is what the stores expect.

### Reproducible builds from the source package

`npm run build:src` produces `build/casper-wallet-src#<sha>.zip`, the package
submitted alongside the extension for source review. Rebuilding it yields an
artifact byte-identical to the published one — including `manifest.json`:

```shell
unzip casper-wallet-src#<sha>.zip -d casper-wallet-src
cd casper-wallet-src
npm ci
npm run build:firefox   # or build:chrome / build:safari
```

The package carries no `.git`, so the `HASH=$(git rev-parse HEAD)` in the build
scripts resolves to nothing there. The commit stamped into
`manifest.version_name` comes from `build-hash.json`, written into the package by
`npm run build:src`. To build a tree that has neither — a downloaded tarball, for
instance — pass the commit explicitly:

```shell
HASH=<full commit sha> npm run build:manifest:v2:firefox
```

A production build with no commit available anywhere fails rather than stamping a
placeholder, since the resulting artifact could not be reproduced.

## Unit tests

Unit tests are written with [Jest](https://jestjs.io/) and colocated with the source code.

```shell
npm test
```

To collect coverage (CI enforces a coverage gate):

```shell
npm run test:coverage
```

## Code quality checks

Run the same checks as CI (Prettier, ESLint, TypeScript, knip and unit tests with coverage) with a single command:

```shell
npm run ci-check
```

The individual checks are also available as separate scripts: `npm run format:check`, `npm run lint`, `npm run tsc`, `npm run knip`.

To run the project's [Semgrep](https://semgrep.dev/) static-analysis rules locally (requires the `semgrep` CLI):

```shell
npm run semgrep
```

## E2E tests

Write tests into the `e2e-tests` folder. Each script below builds the extension first and then runs the [Playwright](https://playwright.dev/docs/running-tests) suite.

In UI mode:

```shell
npm run e2e:chrome:ui:popup
npm run e2e:chrome:ui:onboarding
```

Headless:

```shell
npm run e2e:chrome:headless:popup
npm run e2e:chrome:headless:onboarding
npm run e2e:firefox:headless:smoke
```

## Contributing & security

- Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
- To report a security vulnerability, please follow [SECURITY.md](SECURITY.md) — do not open a public issue.

## License

Casper Wallet is licensed under the [Apache License 2.0](LICENSE).
