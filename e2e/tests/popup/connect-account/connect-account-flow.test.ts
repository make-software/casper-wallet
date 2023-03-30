import { strict as assert } from 'assert';
import { until } from 'selenium-webdriver';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import { switchToNewWindow, unlockVault, createAccount } from '../../common';
import { byTestId, byText, getUrlPath } from '../../../utils/helpers';

describe('Popup UI: Connect account', () => {
  let driver: Driver;
  // Store the ID of the original window
  let playgroundWindow: string;

  const playgroundUrl = 'https://casper-wallet-playground.make.services/';

  beforeAll(async () => {
    driver = await buildWebDriver();
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should open playground app', async () => {
    await driver.get(playgroundUrl);

    assert(await driver.findElement(byText('Casper Wallet Playground')));
  });

  it('should open connect account window', async () => {
    playgroundWindow = await driver.getWindowHandle();

    await switchToNewWindow(driver, playgroundWindow, 'Connect');

    assert.ok(await driver.findElement(byText('Your wallet is locked')));
  });

  it('should unlock vault', async () => {
    await unlockVault(driver);

    // Need to wait for the finishing script for unlock vault
    await driver.wait(
      until.elementLocated(byText('Connect with Casper Wallet Playground'))
    );

    assert.ok(
      await driver.findElement(byText('Connect with Casper Wallet Playground'))
    );
  });

  it('should select account and navigate to the next page', async () => {
    await driver.clickElement(byText('Account 1'));
    await driver.clickElement(byText('Next'));

    assert.ok(await driver.findElement(byText('Connect to 1 account')));
  });

  it('should connect the account and close the window', async () => {
    await driver.clickElement(byText('Connect to 1 account'));

    // Wait for connecting
    await driver.wait(
      async () => (await driver.getAllWindowHandles()).length === 1,
      10000
    );

    // Check if there is one window open
    assert((await driver.getAllWindowHandles()).length === 1);
  });

  it('should find connecting status badges', async () => {
    await driver.switchToWindow(playgroundWindow);
    await driver.switchToNewWindow('window');

    await driver.navigate(AppRoutes.Popup);

    assert.ok(await driver.findElement(byText('Connected: 1')));
    assert.ok(await driver.findElement(byText('• Connected')));
  });

  it('should open navigation menu', async () => {
    await driver.clickElement(byTestId('menu-open-icon'));

    assert.ok(await driver.findElement(byText('Connected sites')));
  });

  it('should open connected sites page', async () => {
    await driver.clickElement(byText('Connected sites'));

    assert.equal(
      await driver.driver.getCurrentUrl().then(getUrlPath),
      'connected-sites'
    );
  });

  it('should find the connected site title', async () => {
    const title = await driver.findElement(byText('Casper Wallet Playground'));

    assert.ok(title);
  });

  it('should find the connected site URL', async () => {
    const url = await driver.findElement(
      byText('casper-wallet-playground.make.services')
    );

    assert.ok(url);
  });

  it('should find the account that connected to the site', async () => {
    const accountName = await driver.findElement(byText('Account 1'));

    assert.ok(accountName);
  });

  it('should find disconnect button', async () => {
    const disconnectButton = await driver.findElement(byText('Disconnect'));

    assert.ok(disconnectButton);
  });
});

describe('Popup UI: Connect two accounts', () => {
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
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should open playground app', async () => {
    await driver.get(playgroundUrl);

    assert(await driver.findElement(byText('Casper Wallet Playground')));
  });

  it('should open connect account window', async () => {
    playgroundWindow = await driver.getWindowHandle();

    await switchToNewWindow(driver, playgroundWindow, 'Connect');

    assert.ok(
      await driver.findElement(byText('Connect with Casper Wallet Playground'))
    );
  });

  it('should select accounts and navigate to the next page', async () => {
    await driver.clickElement(byText('Account 1'));
    await driver.clickElement(byText(newAccountName));
    await driver.clickElement(byText('Next'));

    assert.ok(await driver.findElement(byText('Connect to 2 accounts')));
  });

  it('should connect the accounts and close the window', async () => {
    await driver.clickElement(byText('Connect to 2 accounts'));

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

    assert.ok(await driver.findElement(byText('Connected: 2')));
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

  it('should find the accounts that connected to the site', async () => {
    assert.ok(await driver.findElement(byText('Account 1')));
    assert.ok(await driver.findElement(byText(newAccountName)));
  });
});
