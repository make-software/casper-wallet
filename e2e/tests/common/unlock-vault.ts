import { By } from 'selenium-webdriver';

import { Driver } from '../../webdriver/driver';
import { vaultPassword } from '../../__fixtures';

export const unlockVault = async (driver: Driver) => {
  await driver.fill(
    By.xpath("//input[@placeholder='Password']"),
    vaultPassword
  );
  await driver.clickElement(By.xpath("//button[text()='Unlock wallet']"));
};
