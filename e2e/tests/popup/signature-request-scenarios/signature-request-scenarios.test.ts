import { until } from 'selenium-webdriver';
import { strict as assert } from 'assert';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import {
  clickButtonToOpenExtensionWindowAndFocus,
  connectAccount
} from '../../common';
import { DEFAULT_ACCOUNT, PLAYGROUND_URL } from '../../../constants';
import { byText } from '../../../utils/helpers';

describe('Popup UI: Signature request scenarios', () => {
  let driver: Driver;
  // Store the ID of the original window
  let playgroundWindow: string;

  beforeAll(async () => {
    driver = await buildWebDriver();

    await driver.get(PLAYGROUND_URL);
    playgroundWindow = await driver.getWindowHandle();

    await connectAccount({
      driver,
      currentWindow: playgroundWindow,
      connectAllAccounts: false
    });

    await driver.switchToWindow(playgroundWindow);
  });

  afterAll(async () => {
    await driver.quit();
  });

  describe.each([
    {
      describe: 'transfer',
      clickElement: 'Transfer',
      deployType: 'Transfer Call',
      clickOpenArgumentsElement: 'Transfer Data',
      contractArguments: {
        'Recipient (Key)': DEFAULT_ACCOUNT.truncatedPublicKey,
        Amount: '2.5 CSPR',
        'Transfer ID': '1234'
      }
    },
    {
      describe: 'delegate',
      clickElement: 'Delegate',
      deployType: 'Contract Call',
      entryPoint: 'delegate',
      clickOpenArgumentsElement: 'Contract arguments',
      contractArguments: {
        Delegator: DEFAULT_ACCOUNT.truncatedPublicKey,
        Validator: '0106c...cA2cA',
        Amount: '2.5 CSPR'
      }
    },
    {
      describe: 'undelegate',
      clickElement: 'Undelegate',
      deployType: 'Contract Call',
      entryPoint: 'undelegate',
      clickOpenArgumentsElement: 'Contract arguments',
      contractArguments: {
        Delegator: DEFAULT_ACCOUNT.truncatedPublicKey,
        Validator: '0106c...cA2cA',
        Amount: '2.5 CSPR'
      }
    },
    {
      describe: 'redelegate',
      clickElement: 'Redelegate',
      deployType: 'Contract Call',
      entryPoint: 'redelegate',
      clickOpenArgumentsElement: 'Contract arguments',
      contractArguments: {
        Delegator: DEFAULT_ACCOUNT.truncatedPublicKey,
        Validator: '0106c...cA2cA',
        Amount: '2.5 CSPR',
        'New validator': '017d9...2009e'
      }
    }
  ])(
    'should sign the $describe request',
    ({
      clickElement,
      deployType,
      entryPoint,
      contractArguments,
      clickOpenArgumentsElement,
      describe
    }) => {
      it(`should click the ${describe} button on dapp and open signature request window`, async () => {
        await clickButtonToOpenExtensionWindowAndFocus(
          driver,
          playgroundWindow,
          clickElement
        );

        assert.ok(
          await driver.isElementPresent(byText('Signature Request')),
          "Can't find - Signature Request"
        );
      });

      it('should find signature request data', async () => {
        await driver.clickElement(byText(clickOpenArgumentsElement));

        assert.ok(
          await driver.isElementPresent(byText(deployType)),
          `Can't find - ${deployType}`
        );

        if (entryPoint) {
          assert.ok(
            await driver.isElementPresent(byText(entryPoint)),
            `Can't find - ${entryPoint}`
          );
        }

        for (const [key, value] of Object.entries(contractArguments)) {
          assert.ok(
            await driver.isElementPresent(byText(key)),
            `Can't find - ${key}`
          );
          assert.ok(
            await driver.isElementPresent(byText(value)),
            `Can't find - ${value}`
          );
        }
      });

      it(`should successfully sign the ${describe} request`, async () => {
        await driver.clickElement(byText('Sign'));

        await driver.switchToWindow(playgroundWindow);

        // Wait for the alert to be displayed
        await driver.wait(until.alertIsPresent());

        // Store the alert in a variable
        const alert = await driver.driver.switchTo().alert();

        const alertText = await alert.getText();

        assert.match(alertText, /Sign successful/);
        await alert.accept();
      });
    }
  );
});
