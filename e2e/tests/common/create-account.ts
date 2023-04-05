import { Driver } from '../../webdriver/driver';
import { byInputName, byTestId, byText } from '../../utils/helpers';

export const createAccount = async (driver: Driver, newAccountName: string) => {
  await driver.clickElement(byTestId('menu-open-icon'));

  await driver.clickElement(byText('Create account'));

  const accountNameInput = await driver.findElement(byInputName('name'));

  await accountNameInput.fill(newAccountName);

  await driver.clickElement(byText('Create Account'));
};
