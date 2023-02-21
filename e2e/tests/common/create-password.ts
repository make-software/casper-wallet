import { By } from 'selenium-webdriver';

import { Driver } from '../../webdriver/driver';
import { vaultPassword } from '../../__fixtures';

export const createPassword = async (driver: Driver) => {
  await driver.fill(
    By.xpath("//input[@placeholder='Password']"),
    vaultPassword
  );
  await driver.fill(
    By.xpath("//input[@placeholder='Confirm password']"),
    vaultPassword
  );

  const checkbox = await driver.findElement(
    By.xpath("//*[@data-testid='terms-checkbox']")
  );
  await checkbox.click();
  await driver.clickElement(By.xpath("//button[text()='Create password']"));
};
