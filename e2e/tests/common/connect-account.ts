import { unlockVault } from './unlock-vault';
import { clickButtonToOpenExtensionWindowAndFocus } from './click-button-to-open-extension-window-and-focus';

import { Driver } from '../../webdriver/driver';
import { byTestId, byText } from '../../utils/helpers';
import { ACCOUNT_NAMES, TIMEOUT } from '../../constants';

export const connectAccount = async ({
  driver,
  currentWindow,
  connectAllAccounts
}: {
  driver: Driver;
  currentWindow: string;
  connectAllAccounts?: boolean;
}) => {
  await clickButtonToOpenExtensionWindowAndFocus(
    driver,
    currentWindow,
    'Connect'
  );

  const isWalletLocked = await driver.isElementPresent(
    byText('Your wallet is locked')
  );

  if (isWalletLocked) {
    await unlockVault(driver);
  }

  if (connectAllAccounts) {
    await driver.clickElement(byText('select all'));
  } else {
    await driver.clickElement(byText(ACCOUNT_NAMES.defaultAccountName));
  }

  await driver.clickElement(byText('Next'));

  await driver.clickElement(byTestId('connect-accounts-button'));

  // Wait for connecting
  await driver.wait(
    async () => (await driver.getAllWindowHandles()).length === 1,
    TIMEOUT['15sec']
  );
};
