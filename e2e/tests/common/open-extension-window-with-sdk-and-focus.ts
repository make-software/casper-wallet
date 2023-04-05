import { strict as assert } from 'assert';

import { Driver } from '../../webdriver/driver';
import { byText } from '../../utils/helpers';
import { TIMEOUT } from '../../constants';

export const openExtensionWindowWithSDKAndFocus = async (
  driver: Driver,
  currentWindow: string,
  clickElement: string
) => {
  // Check if there is one window open
  assert.equal((await driver.getAllWindowHandles()).length, 1);

  await driver.clickElement(byText(clickElement));

  // Wait for the new window
  await driver.wait(
    async () => (await driver.getAllWindowHandles()).length === 2,
    TIMEOUT,
    async () => {
      console.log(
        `amount of windows: ${
          (await driver.getAllWindowHandles()).length
        }, should be 2`
      );
    }
  );

  // Loop through until we find a new window handle
  const windows = await driver.getAllWindowHandles();

  for (const handle of windows) {
    if (handle !== currentWindow) {
      await driver.switchToWindow(handle);
    }
  }
};
