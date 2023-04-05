import { strict as assert } from 'assert';
import { until } from 'selenium-webdriver';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import {
  openExtensionWindowWithSDKAndFocus,
  unlockVault,
  createAccount,
  lockVault
} from '../../common';
import { byTestId, byText, getUrlPath } from '../../../utils/helpers';
import { ACCOUNT_NAMES, PLAYGROUND_URL, TIMEOUT } from '../../../constants';

describe.each([
  {
    testName: 'account',
    selectAllAccounts: false,
    createdAccountName: ACCOUNT_NAMES.createdAccountName,
    defaultAccountName: ACCOUNT_NAMES.defaultAccountName
  },
  {
    testName: 'two accounts',
    selectAllAccounts: true,
    createdAccountName: ACCOUNT_NAMES.createdAccountName,
    defaultAccountName: ACCOUNT_NAMES.defaultAccountName
  }
])(
  `Popup UI: Connect $testName`,
  ({ selectAllAccounts, defaultAccountName, createdAccountName }) => {
    let driver: Driver;
    // Store the ID of the original window
    let playgroundWindow: string;

    beforeAll(async () => {
      driver = await buildWebDriver();

      await driver.navigate(AppRoutes.Popup);

      if (selectAllAccounts) {
        await unlockVault(driver);
        await createAccount(driver, createdAccountName);
        await lockVault(driver);
      }

      await driver.get(PLAYGROUND_URL);

      playgroundWindow = await driver.getWindowHandle();
    });

    afterAll(async () => {
      await driver.quit();
    });

    it('should open connect account window and unlock vault', async () => {
      await openExtensionWindowWithSDKAndFocus(
        driver,
        playgroundWindow,
        'Connect'
      );

      await driver.wait(
        until.elementLocated(byText('Your wallet is locked')),
        TIMEOUT
      );

      await unlockVault(driver);

      await driver.wait(
        until.elementLocated(byText('Connect with Casper Wallet Playground')),
        TIMEOUT
      );

      assert.ok(
        await driver.findElement(
          byText('Connect with Casper Wallet Playground')
        )
      );
    });

    it('should select all accounts and navigate to the next page', async () => {
      if (selectAllAccounts) {
        await driver.clickElement(byText('select all'));
      } else {
        await driver.clickElement(byText(defaultAccountName));
      }

      await driver.clickElement(byText('Next'));

      assert.ok(
        await driver.findElement(
          byText(
            selectAllAccounts ? 'Connect to 2 accounts' : 'Connect to 1 account'
          )
        )
      );
    });

    it(`should connect the ${
      selectAllAccounts ? 'accounts' : 'account'
    } and close the window`, async () => {
      await driver.clickElement(
        byText(
          selectAllAccounts ? 'Connect to 2 accounts' : 'Connect to 1 account'
        )
      );

      // Wait for connecting
      await driver.wait(
        async () => (await driver.getAllWindowHandles()).length === 1,
        TIMEOUT,
        async () => {
          console.log(
            `amount of windows: ${
              (await driver.getAllWindowHandles()).length
            }, should be 1`
          );
        }
      );

      // Check if there is one window open
      assert.equal((await driver.getAllWindowHandles()).length, 1);
    });

    it('should open connected site page', async () => {
      await driver.switchToWindow(playgroundWindow);
      await driver.createNewWindowOrTabAndSwitch('window');

      await driver.navigate(AppRoutes.Popup);

      await driver.clickElement(byTestId('menu-open-icon'));
      await driver.clickElement(byText('Connected sites'));

      assert.equal(
        await driver.driver.getCurrentUrl().then(getUrlPath),
        'connected-sites'
      );
    });

    it(`should find the ${
      selectAllAccounts ? 'accounts' : 'account'
    } that connected to the site`, async () => {
      if (selectAllAccounts) {
        assert.ok(await driver.findElement(byText(createdAccountName)));
        assert.ok(await driver.findElement(byText(defaultAccountName)));
      } else {
        assert.ok(await driver.findElement(byText(defaultAccountName)));
      }
    });

    it('should find the connected site title', async () => {
      assert.ok(await driver.findElement(byText('Casper Wallet Playground')));
    });

    it('should find the connected site URL', async () => {
      assert.ok(
        await driver.findElement(
          byText('casper-wallet-playground.make.services')
        )
      );
    });

    it('should find disconnect button', async () => {
      assert.ok(await driver.findElement(byText('Disconnect')));
    });
  }
);
