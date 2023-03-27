import { By } from 'selenium-webdriver';
import { strict as assert } from 'assert';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import { secretKeyPath } from '../../../__fixtures';
import { unlockVault } from '../../common';
import { byText, byTestId, getUrlPath } from '../../../utils/helpers';

describe('Popup UI: Import account with file', () => {
  let driver: Driver;
  // Store the ID of the original window
  let popupWindow: string;
  const accountName = 'Imported account';
  const accountTruncatedPublicKey = '0184f...dad55';

  beforeAll(async () => {
    driver = await buildWebDriver();

    await driver.navigate(AppRoutes.Popup);
    await unlockVault(driver);
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should open navigation menu', async () => {
    await driver.clickElement(byTestId('menu-open-icon'));

    assert.ok(await driver.findElement(byText('Import account')));
  });

  it('should open import account window', async () => {
    popupWindow = await driver.getWindowHandle();

    // Check if there is one window open
    assert((await driver.getAllWindowHandles()).length === 1);

    await driver.clickElement(byText('Import account'));

    // Wait for the new window
    await driver.wait(
      async () => (await driver.getAllWindowHandles()).length === 2,
      10000
    );

    // Loop through until we find a new window handle
    const windows = await driver.getAllWindowHandles();
    for (const handle of windows) {
      if (handle !== popupWindow) {
        await driver.switchToWindow(handle);
      }
    }

    assert.ok(
      driver.findElement(byText('Import account from secret key file'))
    );
  });

  it('should upload the file and fill the account name', async () => {
    await driver.clickElement(byText('Upload your file'));

    const fileInput = await driver.findElement(
      By.xpath("//input[@type='file']")
    );
    const accountNameInput = await driver.findElement(
      By.xpath("//input[@type='text']")
    );
    const importButton = await driver.findElement(byText('Import'));

    await fileInput.fill(secretKeyPath);
    await accountNameInput.fill(accountName);

    assert.ok(importButton.isEnabled());
  });

  it('should import successfully and close the import account window', async () => {
    await driver.clickElement(byText('Import'));

    await driver.clickElement(byText('Done'));

    assert((await driver.getAllWindowHandles()).length === 1);
  });

  it('should open account list page', async () => {
    await driver.switchToWindow(popupWindow);

    await driver.clickElement(byText('Switch account'));

    assert.equal(
      await driver.driver.getCurrentUrl().then(getUrlPath),
      'account-list'
    );
  });

  it('should find the imported account name in the accounts list', async () => {
    const importedAccount = await driver.findElement(byText(accountName));

    assert.ok(importedAccount);
  });

  it('should find the truncated public key of the imported account', async () => {
    const truncatedPublicKey = await driver.findElement(
      byText(accountTruncatedPublicKey)
    );

    assert.ok(truncatedPublicKey);
  });

  it('should find the imported tag', async () => {
    const importedTag = await driver.findElement(byText('Imported'));

    assert.ok(importedTag);
  });
});
