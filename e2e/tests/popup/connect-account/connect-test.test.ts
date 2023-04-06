import { until } from 'selenium-webdriver';
import { strict as assert } from 'assert';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import { lockVault, unlockVault } from '../../common';
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

  it('should lock vault', async () => {
    await driver.wait(
      until.elementLocated(byText('Your wallet is locked')),
      TIMEOUT
    );

    await lockVault(driver);

    assert.ok(
      await driver
        .wait(until.elementLocated(byText('Your wallet is locked')), 1000 * 60)
        .catch(async () => {
          await driver.verboseReportOnFailure(`Failed on - lock vault`);
        })
    );
  });

  it('should unlock vault 2 time', async () => {
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
          await driver.verboseReportOnFailure(
            `Failed on - account name (unlock)`
          );
        })
    );
  });
});
