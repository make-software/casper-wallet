import { By } from 'selenium-webdriver';

import { Driver } from '../webdriver/driver';
import { TIMEOUT } from '../constants';

export const getUrlPath = (url: string) => url.split('#/')[1];

export const byText = (text: string) => By.xpath(`//*[text()='${text}']`);

export const byTestId = (dataTestId: string) =>
  By.xpath(`//*[@data-testid='${dataTestId}']`);

export const byInputName = (name: string) =>
  By.xpath(`//input[@name='${name}']`);

export const byButtonText = (text: string) =>
  By.xpath(`//button[text()='${text}']`);

export const isElementPresent = async (
  driver: Driver,
  locatorKey: By,
  elementName?: string
) => {
  try {
    return Boolean(
      await driver.wait(
        () => driver.driver.findElement(locatorKey),
        TIMEOUT['15sec']
      )
    );
  } catch (e) {
    await driver.verboseReportOnFailure(`Can't find element - ${elementName}`);
    return false;
  }
};

export const areElementsPresent = async (driver: Driver, locatorKey: By) => {
  const elements = await driver.wait(
    () => driver.driver.findElements(locatorKey),
    TIMEOUT['15sec']
  );

  return elements.length > 0;
};
