import { By } from 'selenium-webdriver';
import { strict as assert } from 'assert';

import { Driver } from '../../webdriver/driver';
import { buildWebDriver } from '../../webdriver';
import { AppRoutes } from '../../app-routes';
import { recoverSecretPhrase } from '../../__fixtures';
import { createPassword, getUrlPath } from '../../utils/helpers';

describe('Onboarding UI: recover secret phrase flow [happy path]', () => {
  let driver: Driver;

  beforeAll(async () => {
    driver = await buildWebDriver();
    await driver.navigate(AppRoutes.Onboarding);
    // This testsuits should test a scenario for recovery wallet, so we should navigate to start place
    // Welcome page
    await driver.clickElement(By.xpath("//*[text()='Get started']"));
    // Create password page
    await createPassword(driver);
  });

  afterAll(async () => {
    await driver.quit();
  });

  describe('`Create Secret Phrase` page', () => {
    it('should navigate to `Recover From Secret Phrase` page when the user clicked on `Import an existing secret recovery phrase` button', async () => {
      await driver.clickElement(
        By.xpath("//*[text()='Import an existing secret recovery phrase']")
      );

      assert.equal(
        await driver.driver.getCurrentUrl().then(getUrlPath),
        'recover-from-secret-phrase'
      );
    });
  });

  describe('`Recover From Secret Phrase` page', () => {
    it('should recover the wallet without errors when the user correctly entered the recovery secret phrase in the text area and click on `Recover my wallet` button', async () => {
      await driver.fill(
        By.xpath("//textarea[@placeholder='e.g. Bobcat Lemon Blanket…']"),
        recoverSecretPhrase
      );

      await driver.clickElement(
        By.xpath("//button[text()='Recover my wallet']")
      );

      assert.notEqual(
        await driver.driver.getCurrentUrl().then(getUrlPath),
        'error'
      );
    });
  });
});
