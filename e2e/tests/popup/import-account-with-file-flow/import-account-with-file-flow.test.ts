import { strict as assert } from 'assert';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import { secretKeyPath } from '../../../__fixtures';
import {
  clickButtonToOpenExtensionWindowAndFocus,
  unlockVault
} from '../../common';
import {
  byText,
  byTestId,
  getUrlPath,
  byInputName
} from '../../../utils/helpers';
import { IMPORTED_ACCOUNT } from '../../../constants';

describe('Popup UI: Import account with file', () => {
  let driver: Driver;
  // Store the ID of the original window
  let popupWindow: string;

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

    assert.ok(
      await driver.isElementPresent(byText('Import account')),
      "Can't find - Import account"
    );
  });

  it('should open import account window', async () => {
    popupWindow = await driver.getWindowHandle();

    await clickButtonToOpenExtensionWindowAndFocus(
      driver,
      popupWindow,
      'Import account'
    );

    assert.ok(
      driver.isElementPresent(byText('Import account from secret key file')),
      "Can't find - Import account from secret key file"
    );
  });

  it('should upload the file and fill the account name', async () => {
    await driver.clickElement(byText('Upload your file'));

    const fileInput = await driver.findElement(byInputName('secretKeyFile'));
    const accountNameInput = await driver.findElement(byInputName('name'));
    const importButton = await driver.findElement(byText('Import'));

    await fileInput.fill(secretKeyPath);
    await accountNameInput.fill(IMPORTED_ACCOUNT.accountName);

    assert.ok(importButton.isEnabled());
  });

  it('should import successfully and close the import account window', async () => {
    await driver.clickElement(byText('Import'));

    await driver.clickElement(byText('Done'));

    assert.equal((await driver.getAllWindowHandles()).length, 1);
  });

  it('should open account list page', async () => {
    await driver.switchToWindow(popupWindow);

    await driver.clickElement(byText('Switch account'));

    assert.equal(
      await driver.driver.getCurrentUrl().then(getUrlPath),
      'account-list'
    );
  });

  it.each([
    {
      describe: 'imported account name',
      expectedElement: IMPORTED_ACCOUNT.accountName
    },
    {
      describe: 'truncated public key of the imported account',
      expectedElement: IMPORTED_ACCOUNT.truncatedPublicKey
    },
    {
      describe: 'imported tag',
      expectedElement: 'Imported'
    }
  ])(
    'should find the $describe on the accounts list',
    async ({ expectedElement }) => {
      assert.ok(
        await driver.isElementPresent(byText(expectedElement), expectedElement),
        `Can't find - ${expectedElement}`
      );
    }
  );
});
