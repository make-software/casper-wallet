import { strict as assert } from 'assert';
import { buildWebDriver } from '../webdriver';

import { Driver } from '../webdriver/driver';

const vaultPassword = '3hQqzYn4C7Y8rEZTVEZb';

describe('Onboarding UI flow', () => {
  let driver: Driver;

  beforeAll(async () => {
    driver = await buildWebDriver();
    await driver.navigate('onboarding');
  });

  describe('`Welcome` page', () => {
    it('should contains `Get started` button with text, which navigate to `Create password` page by click on it', async () => {
      const getStartedButton = await driver.findElement(
        '[data-testid="welcome:get-started-button"]'
      );

      assert.equal(await getStartedButton.getText(), 'Get started');

      await getStartedButton.click();
      assert.equal(
        await driver.driver.getCurrentUrl(),
        'chrome-extension://aohghmighlieiainnegkcijnfilokake/onboarding.html#/create-vault-password'
      );
    });
  });

  describe('`Create password` page', () => {
    it('should navigate to `Create secret phrase confirmation` page', async () => {
      try {
        await driver.fill(
          '[data-testid="create-password:password-input"]',
          vaultPassword
        );
        await driver.fill(
          '[data-testid="create-password:confirm-password-input"]',
          vaultPassword
        );

        await driver.clickElement(
          '[data-testid="create-password:create-password-checkbox"]'
        );
        await driver.clickElement(
          '[data-testid="create-password:create-password-button"]'
        );

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
      await driver.navigate('onboarding');
    });

    it('should unlock vault after user provide correct password', async () => {
      const unlockWalletHeader = await driver.findElement('h1');
      assert.equal(await unlockWalletHeader.getText(), 'Your wallet is locked');

      await driver.fill(
        '[data-testid="unlock-wallet:password-input"]',
        vaultPassword
      );
      await driver.clickElement(
        '[data-testid="unlock-wallet:unlock-wallet-button"]'
      );

      const createPhraseHeader = await driver.findElement('h1');
      assert.equal(await createPhraseHeader.getText(), 'Create secret phrase');
    });
  });
});
