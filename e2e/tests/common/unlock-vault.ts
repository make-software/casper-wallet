import { Driver } from '../../webdriver/driver';
import { vaultPassword } from '../../__fixtures';
import { byButtonText, byInputName } from '../../utils/helpers';

export const unlockVault = async (driver: Driver) => {
  await driver.fill(byInputName('password'), vaultPassword);
  await driver.clickElement(byButtonText('Unlock wallet'));
};
