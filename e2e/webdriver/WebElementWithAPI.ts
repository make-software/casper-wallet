import { until, WebElement } from 'selenium-webdriver';

import { IWebElementWithAPI, Key } from './types';
import { Driver } from './driver';
import { ElementState } from '../constants';

export class WebElementWithAPI
  extends WebElement
  implements IWebElementWithAPI
{
  element: WebElement;
  driver: Driver;

  constructor(driver: Driver, element: WebElement) {
    super(driver.driver, element.getId());
    this.driver = driver;
    this.element = element;
  }

  async press(key: Key): Promise<void> {
    return this.element.sendKeys(key);
  }
  async fill(input: Key): Promise<void> {
    await this.element.clear();
    await this.element.sendKeys(input);
  }
  async waitForElementState(state: string, timeout: number): Promise<void> {
    switch (state) {
      case ElementState.hidden:
        // @ts-ignore TODO: clarify Condition<boolean> case here
        return await driver.wait(until.stalenessOf(element), timeout);
      case ElementState.visible:
        return await this.driver.wait(
          until.elementIsVisible(this.element),
          timeout
        );
      default:
        throw new Error(`Provided state: '${state}' is not supported`);
    }
  }
}
