import { By } from 'selenium-webdriver';

import { vaultPassword } from '../__fixtures';
import { Driver } from '../webdriver/driver';

export const getUrlPath = (url: string) => url.split('#/')[1];

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
