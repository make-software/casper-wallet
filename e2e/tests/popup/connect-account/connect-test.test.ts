import { until } from 'selenium-webdriver';
import { strict as assert } from 'assert';

import { Driver } from '../../../webdriver/driver';
import { buildWebDriver } from '../../../webdriver';
import { AppRoutes } from '../../../app-routes';
import { lockVault, unlockVault } from '../../common';
// import { TIMEOUT } from '../../../constants';
import { byText } from '../../../utils/helpers';

describe('Test', () => {
  let driver: Driver;

  beforeAll(async () => {
    driver = await buildWebDriver();

    await driver.navigate(AppRoutes.Popup);

    await unlockVault(driver).finally(async () => {
      await driver.verboseReportOnFailure(`Unlock vault - 0`);
    });
    await lockVault(driver).finally(async () => {
      await driver.verboseReportOnFailure(`Lock vault - 0`);
    });
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should unlock vault 1', async () => {
    // await driver.wait(
    //   until.elementLocated(byText('Your wallet is locked')),
    //   TIMEOUT
    // );

    await unlockVault(driver).finally(async () => {
      await driver.verboseReportOnFailure(`Unlock vault - 1`);
    });

    assert.ok(
      await driver
        .wait(until.elementLocated(byText('Lock wallet')), 1000 * 60)
        .catch(async () => {
          await driver.verboseReportOnFailure(`Failed on - unlock vault 1`);
        })
    );
  });

  it('should lock vault 1', async () => {
    // await driver.wait(until.elementLocated(byText('Lock wallet')), TIMEOUT);

    await driver.clickElement(byText('Lock wallet')).finally(async () => {
      await driver.verboseReportOnFailure(`Lock vault - 1`);
    });

    assert.ok(
      await driver
        .wait(until.elementLocated(byText('Your wallet is locked')), 1000 * 60)
        .catch(async () => {
          await driver.verboseReportOnFailure(`Failed on - lock vault 1`);
        })
    );
  });

  it('should unlock vault 2', async () => {
    // await driver.wait(
    //   until.elementLocated(byText('Your wallet is locked')),
    //   TIMEOUT
    // );

    await unlockVault(driver).finally(async () => {
      await driver.verboseReportOnFailure(`Unlock vault - 2`);
    });

    assert.ok(
      await driver
        .wait(until.elementLocated(byText('Lock wallet')), 1000 * 60)
        .catch(async () => {
          await driver.verboseReportOnFailure(`Failed on - unlock vault 2`);
        })
    );
  });
});
