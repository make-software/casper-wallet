import { strict as assert } from 'assert';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import {
  createAccount,
  unlockVault,
  openConnectedSitePage,
  connectAccount
} from '../../common';
import {
  byTestId,
  byText,
  isElementPresent,
  isElementsPresents
} from '../../../utils/helpers';
import { ACCOUNT_NAMES, PLAYGROUND_URL } from '../../../constants';

describe('Popup UI: Disconnect account', () => {
  let driver: Driver;
  // Store the ID of the original window
  let playgroundWindow: string;

  beforeEach(async () => {
    driver = await buildWebDriver();

    await driver.navigate(AppRoutes.Popup);

    await unlockVault(driver);
    await createAccount(driver, ACCOUNT_NAMES.createdAccountName);

    await driver.get(PLAYGROUND_URL);
    playgroundWindow = await driver.getWindowHandle();

    await connectAccount({
      driver,
      currentWindow: playgroundWindow,
      connectAllAccounts: true
    });

    await driver.switchToWindow(playgroundWindow);
  });

  afterEach(async () => {
    await driver.quit();
  });

  it('should click the disconnect button on dapp and disconnect all accounts from the site', async () => {
    await driver.clickElement(byText('Disconnect'));

    await openConnectedSitePage(driver);

    const areAnyAccountsConnected = await isElementsPresents(
      driver,
      byTestId('account-name')
    );

    assert.equal(areAnyAccountsConnected, false);
    assert.ok(await isElementPresent(driver, byText('No connected sites yet')));
  });

  it.each([
    {
      describe: 'one account',
      disconnectButton: byTestId('disconnect-account-icon'),
      elementsExpected: true,
      expectedElement: ACCOUNT_NAMES.createdAccountName
    },
    {
      describe: 'all accounts',
      disconnectButton: byText('Disconnect'),
      elementsExpected: false,
      expectedElement: 'No connected sites yet'
    }
  ])(
    'should click the disconnect button on connecting site page and disconnect $describe from the site',
    async ({ disconnectButton, elementsExpected, expectedElement }) => {
      await openConnectedSitePage(driver);
      await driver.clickElement(disconnectButton);

      const isAccountsPresent = await isElementsPresents(
        driver,
        byTestId('account-name')
      );

      assert.equal(isAccountsPresent, elementsExpected);
      assert.ok(await isElementPresent(driver, byText(expectedElement)));
    }
  );
});
