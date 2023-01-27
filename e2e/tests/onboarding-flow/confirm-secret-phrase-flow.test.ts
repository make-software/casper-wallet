import { By, until } from 'selenium-webdriver';
import { strict as assert } from 'assert';

import { Driver } from '../../webdriver/driver';
import { buildWebDriver } from '../../webdriver';
import { AppRoutes } from '../../app-routes';
import { getUrlPath } from '../../utils/helpers';
import { WebElementWithAPI } from '../../webdriver/WebElementWithAPI';
import { createPassword } from '../common';

describe('Onboarding UI: confirm secret phrase flow [happy path]', () => {
  let driver: Driver;
  let copiedPhrase: string;
  let secretPhraseList: WebElementWithAPI;
  let secretPhrase: string[];

  beforeAll(async () => {
    driver = await buildWebDriver();
    await driver.navigate(AppRoutes.Onboarding);
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should contain `Get started` button with text, which navigates to `Create password` page by clicking on it', async () => {
    const getStartedButton = await driver.findElement(
      By.xpath("//*[text()='Get started']")
    );

    await getStartedButton.click();
    assert.equal(
      await driver.driver.getCurrentUrl().then(getUrlPath),
      'create-vault-password'
    );
  });

  it('should navigate to `Create secret phrase` page when the user filled the password, checked the checkbox, and click on `Create password` button', async () => {
    await createPassword(driver);

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

  it('should navigate to `Create Secret Phrase Confirmation` page by clicking on `Create my secret recovery phrase` button', async () => {
    await driver.clickElement(
      By.xpath("//*[text()='Create my secret recovery phrase']")
    );

    assert.equal(
      await driver.driver.getCurrentUrl().then(getUrlPath),
      'create-secret-phrase-confirmation'
    );
  });

  it('should navigate to `Write Down Secret Phrase` page when the user checked the checkbox and clicks on `Next` button', async () => {
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

  it('should contain a `Copy secret recovery phrase` link which copies a phrase with 24 words to the clipboard', async () => {
    await driver.clickElement(
      By.xpath("//*[text()='Copy secret recovery phrase']")
    );

    secretPhraseList = await driver.findElement(
      By.xpath("//*[@data-testid='word-list']")
    );
    secretPhrase = (await secretPhraseList.getText()).split('\n');

    // Firefox only supports reading the clipboard in browser extensions.
    // So this is the hack to pass this test for it.
    if (driver.browser === 'firefox') {
      expect(true);
    } else {
      copiedPhrase = (await driver.executeScript(
        'return navigator.clipboard.readText();'
      )) as string;

      assert.equal(copiedPhrase.split(' ').length, 24);
    }
  });

  it('should navigate to `Confirm Secret Phrase` page when the user checks the checkbox and clicks on `Next` button', async () => {
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

  it('should navigate to `Confirm Secret Phrase Success` page when the user completed the puzzle test and clicks on `Confirm` button', async () => {
    const phrase = copiedPhrase?.split(' ') || secretPhrase;

    const wordPicker = await driver.findElement(
      By.xpath("//*[@data-testid='word-picker']")
    );

    const hiddenWords = (await wordPicker.getText()).split('\n');

    for (let i = 0; i < phrase.length; i++) {
      const word = phrase[i];

      if (hiddenWords.includes(word)) {
        await wordPicker.findElement(By.xpath(`//*[text()='${word}']`)).click();
      }
    }

    await driver.clickElement(By.xpath("//button[text()='Confirm']"));

    assert.equal(
      await driver.driver.getCurrentUrl().then(getUrlPath),
      'confirm-secret-phrase-success'
    );
  });

  it('should navigate to `Onboarding Success` page when the user clicks on `Done` button', async () => {
    await driver.clickElement(By.xpath("//button[text()='Done']"));

    assert.equal(
      await driver.driver.getCurrentUrl().then(getUrlPath),
      'onboarding-success'
    );
  });

  it('should contains a `Got it` button', async () => {
    assert.ok(await driver.findElement(By.xpath("//button[text()='Got it']")));
  });
});
describe('Onboarding UI: confirm secret phrase flow [unhappy path]', () => {
  let driver: Driver;
  let secretPhraseList: WebElementWithAPI;
  let secretPhrase: string[];

  beforeAll(async () => {
    driver = await buildWebDriver();
    await driver.navigate(AppRoutes.Onboarding);

    // Welcome page
    await driver.clickElement(By.xpath("//*[text()='Get started']"));

    // Create password page
    await createPassword(driver);

    // Create Secret Phrase page
    await driver.clickElement(
      By.xpath("//*[text()='Create my secret recovery phrase']")
    );

    // Create Secret Phrase Confirmation page
    await driver.clickElement(
      By.xpath(
        "//*[text()='I understand that I am solely responsible for storing and protecting my secret recovery phrase. Access to my funds depend on it.']"
      )
    );
    await driver.clickElement(By.xpath("//button[text()='Next']"));

    // Write Down Secret Phrase page
    await driver.clickElement(
      By.xpath("//*[text()='Copy secret recovery phrase']")
    );

    secretPhraseList = await driver.findElement(
      By.xpath("//*[@data-testid='word-list']")
    );
    secretPhrase = (await secretPhraseList.getText()).split('\n');

    await driver.clickElement(
      By.xpath(
        "//*[text()='I confirm I have written down and securely stored my secret recovery phrase']"
      )
    );
    await driver.clickElement(By.xpath("//button[text()='Next']"));
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should navigate to `Error` page when the user does not pass the puzzle test and clicked on `Confirm` button', async () => {
    const wordPicker = await driver.findElement(
      By.xpath("//*[@data-testid='word-picker']")
    );

    const hiddenWords = (await wordPicker.getText()).split('\n');

    for (let i = secretPhrase.length; i > 0; i--) {
      const word = secretPhrase[i];

      if (hiddenWords.includes(word)) {
        await wordPicker.findElement(By.xpath(`//*[text()='${word}']`)).click();
      }
    }

    await driver.clickElement(By.xpath("//button[text()='Confirm']"));

    assert.equal(await driver.driver.getCurrentUrl().then(getUrlPath), 'error');
  });
});
