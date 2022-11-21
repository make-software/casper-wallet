import { By } from 'selenium-webdriver';
import { strict as assert } from 'assert';
import { buildWebDriver } from '../webdriver';

import { Driver } from '../webdriver/driver';
import { AppRoutes } from '../app-routes';
import { vaultPassword } from '../__fixtures';

describe('Onboarding UI flow: happy path', () => {
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

      assert.equal(
        await driver.driver.getCurrentUrl(),
        'chrome-extension://aohghmighlieiainnegkcijnfilokake/onboarding.html#/create-secret-phrase'
      );
    });
  });

  describe('`Create Secret Phrase` page', () => {
    it('should navigate to `Create Secret Phrase Confirmation` page by click on `Create my secret recovery phrase` button', async () => {
      await driver.clickElement(
        By.xpath("//*[text()='Create my secret recovery phrase']")
      );

      assert.equal(
        await driver.driver.getCurrentUrl(),
        'chrome-extension://aohghmighlieiainnegkcijnfilokake/onboarding.html#/create-secret-phrase-confirmation'
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
        await driver.driver.getCurrentUrl(),
        'chrome-extension://aohghmighlieiainnegkcijnfilokake/onboarding.html#/write-down-secret-phrase'
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
          await driver.driver.getCurrentUrl(),
          'chrome-extension://aohghmighlieiainnegkcijnfilokake/onboarding.html#/confirm-secret-phrase'
        );
      });
    });

    describe('`Confirm Secret Phrase` page', () => {
      it('should navigate to `Awesome, your secret phrase is confirmed!` page when user complete the puzzle test click on `Confirm` button', async () => {
        const phrase = copiedPhrase.split(' ');
        const hiddenWordElements = await driver.findElements(
          By.xpath("//*[starts-with(@data-testid, 'hidden-word-')]")
        );

        const wordPicker = await driver.findElement(
          By.xpath("//*[@data-testid='word-picker']")
        );

        for (let i = 0; i < 6; i++) {
          const hiddenWordElement = hiddenWordElements[i];
          const index = Number.parseInt(await hiddenWordElement.getText()) - 1;

          const hiddenWord = phrase[index];
          await wordPicker
            .findElement(By.xpath(`//*[text()='${hiddenWord}']`))
            .click();
        }

        await driver.clickElement(By.xpath("//button[text()='Confirm']"));

        assert.equal(
          await driver.driver.getCurrentUrl(),
          'chrome-extension://aohghmighlieiainnegkcijnfilokake/onboarding.html#/confirm-secret-phrase-success'
        );
      });
    });
  });

  describe('`Awesome, your secret phrase is confirmed!` page', () => {
    it('should navigate to `Congrats` page when user click on `Done` button', async () => {
      await driver.clickElement(By.xpath("//button[text()='Done']"));

      assert.equal(
        await driver.driver.getCurrentUrl(),
        'chrome-extension://aohghmighlieiainnegkcijnfilokake/onboarding.html#/onboarding-success'
      );
    });
  });

  describe('`Congrats! Your Casper Wallet is set up and ready to go` page', () => {
    it('should contains a `Got it` button', async () => {
      assert.ok(
        await driver.findElement(By.xpath("//button[text()='Got it']"))
      );
    });
  });
});
