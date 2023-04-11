import { Driver } from '../../webdriver/driver';
import { AppRoutes } from '../../app-routes';
import { byTestId, byText } from '../../utils/helpers';

export const openConnectedSitePage = async (driver: Driver) => {
  await driver.createNewWindowOrTabAndSwitch('window');

  await driver.navigate(AppRoutes.Popup);

  await driver.clickElement(byTestId('menu-open-icon'));
  await driver.clickElement(byText('Connected sites'));
};
