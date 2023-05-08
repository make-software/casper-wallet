import { Driver } from '../../webdriver/driver';
import { vaultPassword } from '../../__fixtures';
import { byButtonText, byInputName, byTestId } from '../../utils/helpers';

export const createPassword = async (driver: Driver) => {
  await driver.fill(byInputName('password'), vaultPassword);
  await driver.fill(byInputName('confirmPassword'), vaultPassword);

  const checkbox = await driver.findElement(byTestId('terms-checkbox'));
  await checkbox.click();
  await driver.clickElement(byButtonText('Create password'));
};
