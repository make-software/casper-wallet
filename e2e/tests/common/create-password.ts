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

  await driver.clickElement(
    By.xpath(
      "//*[text()='I have read and agree to the Casper Wallet Terms of Service.']"
    )
  );
  await driver.clickElement(By.xpath("//button[text()='Create password']"));
};
