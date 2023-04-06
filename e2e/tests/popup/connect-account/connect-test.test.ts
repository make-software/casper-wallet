import { until } from 'selenium-webdriver';
import { strict as assert } from 'assert';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import { unlockVault } from '../../common';
import { ACCOUNT_NAMES, TIMEOUT } from '../../../constants';
import { byText } from '../../../utils/helpers';

describe('Test', () => {
  let driver: Driver;

  beforeAll(async () => {
    driver = await buildWebDriver();

    await driver.navigate(AppRoutes.Popup);
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should unlock vault', async () => {
    await driver.wait(
      until.elementLocated(byText('Your wallet is locked')),
      TIMEOUT
    );

    await unlockVault(driver);

    assert.ok(
      await driver
        .wait(
          until.elementLocated(byText(ACCOUNT_NAMES.defaultAccountName)),
          1000 * 60
        )
        .catch(async () => {
          await driver.verboseReportOnFailure(`Failed on - account name`);
        })
    );
  });
});
