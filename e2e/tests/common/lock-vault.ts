import { Driver } from '../../webdriver/driver';
import { byTestId, byText } from '../../utils/helpers';

export const lockVault = async (driver: Driver) => {
  await driver.clickElement(byTestId('menu-open-icon'));
  await driver.clickElement(byText('Lock wallet'));
};
