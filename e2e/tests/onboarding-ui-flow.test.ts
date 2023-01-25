import { By, until } from 'selenium-webdriver';
import { strict as assert } from 'assert';

import { buildWebDriver } from '../webdriver';
import { Driver } from '../webdriver/driver';
import { AppRoutes } from '../app-routes';
import { vaultPassword, recoverSecretPhrase } from '../__fixtures';
import { getUrlPath } from '../utils/helpers';

describe('Onboarding UI: confirm secret phrase flow [happy path]', () => {
  let driver: Driver;

  beforeAll(async () => {
    driver = await buildWebDriver();
    await driver.navigate(AppRoutes.Onboarding);
  });

  afterAll(async () => {
    await driver.quit();
  });

  describe('`Welcome` page', () => {
    it('should contains `Get started` button with text, which navigate to `Create password` page by click on it', async () => {
      const getStartedButton = await driver.findElement(
        By.xpath("//*[text()='Get started']")
      );

      await getStartedButton.click();
      assert.equal(
        await driver.driver.getCurrentUrl().then(getUrlPath),
        'create-vault-password'
      );
    });
  });

  describe('`Create password` page', () => {
    it('should navigate to `Create secret phrase` page when the user filled the password, checked the checkbox and click on `Create password` button', async () => {
      await driver.fill(
        By.xpath("//input[@placeholder='Password']"),
        vaultPassword
      );
      await driver.fill(
        By.xpath("//input[@placeholder='Confirm password']"),
        vaultPassword
      );

      await driver.clickElement(
        By.xpath(
          "//*[text()='I have read and agree to the Casper Wallet Terms of Service.']"
        )
      );
      await driver.clickElement(By.xpath("//button[text()='Create password']"));

      // Need to wait for the finishing script for creating the password
      await driver.wait(
        until.elementLocated(
          By.xpath("//*[text()='Create secret recovery phrase']")
        )
      );

      assert.equal(
        await driver.driver.getCurrentUrl().then(getUrlPath),
        'create-secret-phrase'
      );
    });
  });

  describe('`Create Secret Phrase` page', () => {
    it('should navigate to `Create Secret Phrase Confirmation` page by click on `Create my secret recovery phrase` button', async () => {
      await driver.clickElement(
        By.xpath("//*[text()='Create my secret recovery phrase']")
      );

      assert.equal(
        await driver.driver.getCurrentUrl().then(getUrlPath),
        'create-secret-phrase-confirmation'
      );
    });
  });

  describe('`Create Secret Phrase Confirmation` page', () => {
    it('should navigate to `Write Down Secret Phrase` page when the user checked the checkbox and click on `Next` button', async () => {
      await driver.clickElement(
        By.xpath(
          "//*[text()='I understand that I am solely responsible for storing and protecting my secret recovery phrase. Access to my funds depend on it.']"
        )
      );

      await driver.clickElement(By.xpath("//button[text()='Next']"));

      assert.equal(
        await driver.driver.getCurrentUrl().then(getUrlPath),
        'write-down-secret-phrase'
      );
    });
  });

  describe('Secret phrase puzzle', () => {
    let copiedPhrase: string;

    describe('`Write Down Secret Phrase` page', () => {
      it('should contains a `Copy secret recovery phrase` link which copy phrase with 24 words to clipboard', async () => {
        await driver.clickElement(
          By.xpath("//*[text()='Copy secret recovery phrase']")
        );

        copiedPhrase = (await driver.executeScript(
          'return navigator.clipboard.readText();'
        )) as string;

        assert.equal(copiedPhrase.split(' ').length, 24);
      });

      it('should navigate to `Confirm Secret Phrase` page when user check checkbox and click on `Next` button', async () => {
        await driver.clickElement(
          By.xpath(
            "//*[text()='I confirm I have written down and securely stored my secret recovery phrase']"
          )
        );

        await driver.clickElement(By.xpath("//button[text()='Next']"));

        assert.equal(
          await driver.driver.getCurrentUrl().then(getUrlPath),
          'confirm-secret-phrase'
        );
      });
    });

    describe('`Confirm Secret Phrase` page', () => {
      it('should navigate to `Confirm Secret Phrase Success` page when user complete the puzzle test and click on `Confirm` button', async () => {
        const phrase = copiedPhrase.split(' ');

        const wordPicker = await driver.findElement(
          By.xpath("//*[@data-testid='word-picker']")
        );

        const hiddenWords = (await wordPicker.getText()).split('\n');

        for (let i = 0; i < phrase.length; i++) {
          const word = phrase[i];

          if (hiddenWords.includes(word)) {
            await wordPicker
              .findElement(By.xpath(`//*[text()='${word}']`))
              .click();
          }
        }

        await driver.clickElement(By.xpath("//button[text()='Confirm']"));

        assert.equal(
          await driver.driver.getCurrentUrl().then(getUrlPath),
          'confirm-secret-phrase-success'
        );
      });
    });
  });

  describe('`Confirm Secret Phrase Success` page', () => {
    it('should navigate to `Onboarding Success` page when user click on `Done` button', async () => {
      await driver.clickElement(By.xpath("//button[text()='Done']"));

      assert.equal(
        await driver.driver.getCurrentUrl().then(getUrlPath),
        'onboarding-success'
      );
    });
  });

  describe('`Onboarding Success` page', () => {
    it('should contains a `Got it` button', async () => {
      assert.ok(
        await driver.findElement(By.xpath("//button[text()='Got it']"))
      );
    });
  });
});

describe('Onboarding UI: recover secret phrase flow [happy path]', () => {
  let driver: Driver;

  beforeAll(async () => {
    driver = await buildWebDriver();
    await driver.navigate(AppRoutes.Onboarding);
    // This testsuits should test a scenario for recovery wallet, so we should navigate to start place
    // Welcome page
    await driver.clickElement(By.xpath("//*[text()='Get started']"));
    // Create password page
    await driver.fill(
      By.xpath("//input[@placeholder='Password']"),
      vaultPassword
    );
    await driver.fill(
      By.xpath("//input[@placeholder='Confirm password']"),
      vaultPassword
    );
    await driver.clickElement(
      By.xpath(
        "//*[text()='I have read and agree to the Casper Wallet Terms of Service.']"
      )
    );
    await driver.clickElement(By.xpath("//button[text()='Create password']"));
  });

  afterAll(async () => {
    await driver.quit();
  });

  describe('`Create Secret Phrase` page', () => {
    it('should navigate to `Recover From Secret Phrase` page by click on `Import an existing secret recovery phrase` button', async () => {
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
    it('should recover wallet without errors when user filled correct recover secret phrase in textarea and click on `Recover my wallet` button', async () => {
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
