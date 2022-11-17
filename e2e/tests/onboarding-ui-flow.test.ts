import { By } from 'selenium-webdriver';
import { strict as assert } from 'assert';
import { buildWebDriver } from '../webdriver';

import { Driver } from '../webdriver/driver';
import { AppRoutes } from '../app-routes';
import { vaultPassword } from '../__fixtures';

describe('Onboarding UI flow', () => {
  let driver: Driver;

  beforeAll(async () => {
    driver = await buildWebDriver();
    await driver.navigate(AppRoutes.Onboarding);
  });

  describe('`Welcome` page', () => {
    it('should contains `Get started` button with text, which navigate to `Create password` page by click on it', async () => {
      const getStartedButton = await driver.findElement(
        By.xpath("//*[text()='Get started']")
      );

      await getStartedButton.click();
      assert.equal(
        await driver.driver.getCurrentUrl(),
        'chrome-extension://aohghmighlieiainnegkcijnfilokake/onboarding.html#/create-vault-password'
      );
    });
  });

  describe('`Create password` page', () => {
    it('should navigate to `Create secret phrase confirmation` page when the user filled the password, checked the checkbox and click on `Create password` button', async () => {
      try {
        await driver.fill(
          By.xpath("//input[@placeholder()='Password']"),
          vaultPassword
        );
        await driver.fill(
          By.xpath("//input[@placeholder()='Confirm password']"),
          vaultPassword
        );

        await driver.clickElement(
          By.xpath(
            "//*[text()='I have read and agree to the Casper Wallet Terms of Service.']"
          )
        );
        await driver.clickElement(By.xpath("//*[text()='Create password']"));

        assert.equal(
          await driver.driver.getCurrentUrl(),
          'chrome-extension://aohghmighlieiainnegkcijnfilokake/onboarding.html#/create-secret-phrase'
        );
      } catch (e) {
        console.error(e);
      }
    });
  });

  describe('`Unlock wallet` page', () => {
    beforeAll(async () => {
      // Reopen Onboarding UI. App should be locked by password
      await driver.driver.close();
      driver = await buildWebDriver();
      await driver.navigate(AppRoutes.Onboarding);
    });

    it('should unlock vault after user fill correct password and click on `Unlock wallet` button', async () => {
      const unlockWalletHeader = await driver.findElement('h1');
      assert.equal(await unlockWalletHeader.getText(), 'Your wallet is locked');

      await driver.fill(
        By.xpath("//input[@placeholder()='Password']"),
        vaultPassword
      );
      await driver.clickElement(By.xpath("//*[text()='Unlock wallet']"));

      const createPhraseHeader = await driver.findElement('h1');
      assert.equal(await createPhraseHeader.getText(), 'Create secret phrase');
    });
  });
});
