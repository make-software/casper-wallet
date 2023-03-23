import { By } from 'selenium-webdriver';
import { strict as assert } from 'assert';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import { secretKeyPath } from '../../../__fixtures';
import { unlockVault } from '../../common';

describe('Popup UI: Import account with file', () => {
  let driver: Driver;
  // Store the ID of the original window
  let originalWindow: string;

  beforeAll(async () => {
    driver = await buildWebDriver();

    await driver.navigate(AppRoutes.Popup);
    await unlockVault(driver);
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should open navigation menu', async () => {
    await driver.clickElement(By.xpath("//*[@data-testid='open-menu-button']"));

    assert.ok(
      await driver.findElement(By.xpath("//*[text()='Import account']"))
    );
  });

  it('should open import account window', async () => {
    originalWindow = await driver.getWindowHandle();

    // Check if there is one window open
    assert((await driver.getAllWindowHandles()).length === 1);

    await driver.clickElement(By.xpath("//*[text()='Import account']"));

    // Wait for the new window
    await driver.wait(
      async () => (await driver.getAllWindowHandles()).length === 2,
      10000
    );

    // Loop through until we find a new window handle
    const windows = await driver.getAllWindowHandles();
    for (const handle of windows) {
      if (handle !== originalWindow) {
        await driver.switchToWindow(handle);
      }
    }

    assert.ok(
      driver.findElement(
        By.xpath("//*[text()='Import account from secret key file']")
      )
    );
  });

  it('should be uploaded file and filled the account name', async () => {
    await driver.clickElement(By.xpath("//*[text()='Upload your file']"));

    const uploadFile = await driver.findElement(
      By.xpath("//input[@type='file']")
    );
    const accountName = await driver.findElement(
      By.xpath("//input[@type='text']")
    );
    const importButton = await driver.findElement(
      By.xpath("//*[text()='Import']")
    );

    await uploadFile.fill(secretKeyPath);
    await accountName.fill('User 1');

    assert.ok(importButton.isEnabled());
  });

  it('should be finished import file and closed import account window', async () => {
    await driver.clickElement(By.xpath("//*[text()='Import']"));

    await driver.clickElement(By.xpath("//*[text()='Done']"));

    assert((await driver.getAllWindowHandles()).length === 1);
  });
});
