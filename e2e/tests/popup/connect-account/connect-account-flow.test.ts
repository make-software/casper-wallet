import { strict as assert } from 'assert';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import { switchToNewWindow, unlockVault, createAccount } from '../../common';
import { byTestId, byText, getUrlPath } from '../../../utils/helpers';

describe.each([
  {
    text: 'account',
    selectAllAccounts: false
  },
  {
    text: 'two accounts',
    selectAllAccounts: true
  }
])(`Popup UI: Connect $text`, ({ selectAllAccounts }) => {
  let driver: Driver;
  // Store the ID of the original window
  let playgroundWindow: string;

  const playgroundUrl = 'https://casper-wallet-playground.make.services/';
  const newAccountName = 'New account 1';

  beforeAll(async () => {
    driver = await buildWebDriver();

    await driver.navigate(AppRoutes.Popup);

    await unlockVault(driver);
    await createAccount(driver, newAccountName);

    await driver.get(playgroundUrl);

    playgroundWindow = await driver.getWindowHandle();
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should open connect account window', async () => {
    await switchToNewWindow(driver, playgroundWindow, 'Connect');

    assert.ok(
      await driver.findElement(byText('Connect with Casper Wallet Playground'))
    );
  });

  it('should select all accounts and navigate to the next page', async () => {
    if (selectAllAccounts) {
      await driver.clickElement(byText('select all'));
    } else {
      await driver.clickElement(byText('Account 1'));
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
      10000
    );

    // Check if there is one window open
    assert.equal((await driver.getAllWindowHandles()).length, 1);
  });

  it('should find connecting status badges', async () => {
    await driver.switchToWindow(playgroundWindow);
    await driver.switchToNewWindow('window');

    await driver.navigate(AppRoutes.Popup);

    assert.ok(
      await driver.findElement(
        byText(selectAllAccounts ? 'Connected: 2' : 'Connected: 1')
      )
    );
    assert.ok(await driver.findElement(byText('• Connected')));
  });

  it('should open connected site page', async () => {
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
      assert.ok(await driver.findElement(byText(newAccountName)));
      assert.ok(await driver.findElement(byText('Account 1')));
    } else {
      assert.ok(await driver.findElement(byText('Account 1')));
    }
  });

  it('should find the connected site title', async () => {
    assert.ok(await driver.findElement(byText('Casper Wallet Playground')));
  });

  it('should find the connected site URL', async () => {
    assert.ok(
      await driver.findElement(byText('casper-wallet-playground.make.services'))
    );
  });

  it('should find the account that connected to the site', async () => {
    assert.ok(await driver.findElement(byText('Account 1')));
  });

  it('should find disconnect button', async () => {
    assert.ok(await driver.findElement(byText('Disconnect')));
  });
});
