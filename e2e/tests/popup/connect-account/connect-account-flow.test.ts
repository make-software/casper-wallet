import { strict as assert } from 'assert';
import { until } from 'selenium-webdriver';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import {
  clickButtonToOpenExtensionWindowAndFocus,
  unlockVault,
  createAccount,
  lockVault,
  openConnectedSitePage
} from '../../common';
import { byText, getUrlPath, isElementPresent } from '../../../utils/helpers';
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
  ({ selectAllAccounts, defaultAccountName, createdAccountName, testName }) => {
    let driver: Driver;
    // Store the ID of the original window
    let playgroundWindow: string;

    beforeAll(async () => {
      driver = await buildWebDriver();

      await driver.navigate(AppRoutes.Popup);

      await unlockVault(driver);
      await driver.findElement(byText(ACCOUNT_NAMES.defaultAccountName));

      if (selectAllAccounts) {
        await createAccount(driver, createdAccountName);
      }

      // For now, we disabled this test for Firefox. It failed all the time on CI
      if (driver.browser !== 'firefox') {
        await lockVault(driver);
      }

      await driver.get(PLAYGROUND_URL);

      playgroundWindow = await driver.getWindowHandle();
    });

    afterAll(async () => {
      await driver.quit();
    });

    it('should open connect account window and unlock vault', async () => {
      await clickButtonToOpenExtensionWindowAndFocus(
        driver,
        playgroundWindow,
        'Connect'
      );

      // For now, we disabled this test for Firefox. It failed all the time on CI
      if (driver.browser !== 'firefox') {
        await unlockVault(driver);
      }

      assert.ok(
        await driver
          .wait(
            until.elementLocated(
              byText('Connect with Casper Wallet Playground')
            ),
            TIMEOUT['50sec']
          )
          .catch(async () => {
            await driver.verboseReportOnFailure(
              `Failed on - ${testName}/Connect with Casper Wallet Playground`
            );
          })
      );
    });

    it(`should select ${testName} and navigate to the next page`, async () => {
      if (selectAllAccounts) {
        await driver.clickElement(byText('select all')).catch(async () => {
          await driver.verboseReportOnFailure(
            `Failed on - ${testName}/select all`
          );
        });
      } else {
        await driver
          .clickElement(byText(defaultAccountName))
          .catch(async () => {
            await driver.verboseReportOnFailure(
              `Failed on - ${testName}/one account`
            );
          });
      }

      await driver.clickElement(byText('Next'));

      assert.ok(
        await isElementPresent(
          driver,
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
        TIMEOUT['15sec']
      );

      // Check if there is one window open
      assert.equal((await driver.getAllWindowHandles()).length, 1);
    });

    it('should open connected site page', async () => {
      await driver.switchToWindow(playgroundWindow);

      await openConnectedSitePage(driver);

      assert.equal(
        await driver.driver.getCurrentUrl().then(getUrlPath),
        'connected-sites'
      );
    });

    it(`should find the ${
      selectAllAccounts ? 'accounts' : 'account'
    } that connected to the site`, async () => {
      if (selectAllAccounts) {
        assert.ok(await isElementPresent(driver, byText(createdAccountName)));
        assert.ok(await isElementPresent(driver, byText(defaultAccountName)));
      } else {
        assert.ok(await isElementPresent(driver, byText(defaultAccountName)));
        assert.equal(
          await isElementPresent(driver, byText(createdAccountName)),
          false
        );
      }
    });

    it.each([
      {
        describe: 'connected site title',
        expectedElement: 'Casper Wallet Playground'
      },
      {
        describe: 'connected site URL',
        expectedElement: 'casper-wallet-playground.make.services'
      },
      {
        describe: 'disconnect button',
        expectedElement: 'Disconnect'
      }
    ])('should find the $describe', async ({ expectedElement }) => {
      assert.ok(await isElementPresent(driver, byText(expectedElement)));
    });
  }
);
