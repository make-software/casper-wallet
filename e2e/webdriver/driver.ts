import { promises as fs } from 'fs';
import { strict as assert } from 'assert';
import {
  error as webdriverError,
  ThenableWebDriver,
  WebElement,
  until,
  By,
  Condition,
  WebDriver
} from 'selenium-webdriver';
// @ts-ignore TODO: clarify types for package
import cssToXPath from 'css-to-xpath';

import { WebElementWithAPI } from './WebElementWithAPI';

import { DriverKey, PerformanceResults, RawLocator } from './types';
import { ElementState } from './constants';

function wrapElementWithAPI(
  element: WebElement,
  driver: Driver
): WebElementWithAPI {
  return new WebElementWithAPI(driver, element);
}

/**
 * For Selenium WebDriver API documentation, see:
 * https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html
 */
export class Driver {
  driver: ThenableWebDriver;
  browser: string;
  extensionUrl: string;
  timeout: number;

  static Key: DriverKey;
  static PAGES = {
    POPUP: 'popup'
  };

  constructor(
    driver: ThenableWebDriver,
    browser: string,
    extensionUrl: string,
    timeout = 10000
  ) {
    this.driver = driver;
    this.browser = browser;
    this.extensionUrl = extensionUrl;
    this.timeout = timeout;
    // The following values are found in
    // https://github.com/SeleniumHQ/selenium/blob/trunk/javascript/node/selenium-webdriver/lib/input.js#L50-L110
    // These should be replaced with string constants 'Enter' etc for playwright.
    Driver.Key = {
      BACK_SPACE: '\uE003',
      ENTER: '\uE007'
    };
  }

  async executeAsyncScript(script: string, ...args: string[]) {
    return this.driver.executeAsyncScript(script, args);
  }

  async executeScript(script: string, ...args: string[]) {
    return this.driver.executeScript(script, args);
  }

  buildLocator(locator: RawLocator): By {
    if (typeof locator === 'string') {
      return By.css(locator);
    } else if (locator.value) {
      return locator as By;
    } else if (locator.xpath) {
      return By.xpath(locator.xpath);
    } else if (locator.text) {
      if (locator.css) {
        const xpath = cssToXPath
          .parse(locator.css)
          .where(
            cssToXPath.xPathBuilder
              .string()
              .contains(locator.text)
              .or(
                cssToXPath.xPathBuilder
                  .string()
                  .contains(locator.text.split(' ').join(''))
              )
          )
          .toXPath();
        return By.xpath(xpath);
      }
      return By.xpath(
        `//${locator.tag ?? '*'}[contains(text(), '${locator.text}')]`
      );
    }
    throw new Error(
      `The locator '${locator}' is not supported by the E2E test driver`
    );
  }

  async get(url: string) {
    await this.driver.get(url);
  }

  async fill(rawLocator: RawLocator, input: string) {
    const element = await this.findElement(rawLocator);
    await element.fill(input);
    return element;
  }

  async press(rawLocator: RawLocator, keys: string) {
    const element = await this.findElement(rawLocator);
    await element.press(keys);
    return element;
  }

  async delay(time: number) {
    await new Promise(resolve => setTimeout(resolve, time));
  }

  async wait<T>(
    condition:
      | PromiseLike<T>
      | Condition<T>
      | ((driver: WebDriver) => T | PromiseLike<T>)
      | Function,
    timeout = this.timeout
  ) {
    await this.driver.wait(condition, timeout);
  }

  async waitForSelector(
    rawLocator: RawLocator,
    { timeout = this.timeout, state = ElementState.Visible } = {}
  ) {
    const selector = this.buildLocator(rawLocator);
    let element;
    if (![ElementState.Visible, ElementState.Detached].includes(state)) {
      throw new Error(`Provided state selector ${state} is not supported`);
    }
    if (state === ElementState.Visible) {
      element = await this.driver.wait(until.elementLocated(selector), timeout);
    } else if (state === ElementState.Detached) {
      element = await this.driver.wait(
        until.stalenessOf(await this.findElement(selector)),
        timeout
      );
    }
    return wrapElementWithAPI(element as WebElement, this);
  }

  async quit() {
    await this.driver.quit();
  }

  // Element interactions

  async findElement(rawLocator: RawLocator) {
    const locator = this.buildLocator(rawLocator);
    const element = await this.driver.wait(
      until.elementLocated(locator),
      this.timeout
    );
    return wrapElementWithAPI(element, this);
  }

  async findVisibleElement(rawLocator: string) {
    const locator = this.buildLocator(rawLocator);
    const element = await this.findElement(locator);
    await this.driver.wait(until.elementIsVisible(element), this.timeout);
    return wrapElementWithAPI(element, this);
  }

  async findClickableElement(rawLocator: RawLocator) {
    const locator = this.buildLocator(rawLocator);
    const element = await this.findElement(locator);
    await Promise.all([
      this.driver.wait(until.elementIsVisible(element), this.timeout),
      this.driver.wait(until.elementIsEnabled(element), this.timeout)
    ]);
    return wrapElementWithAPI(element, this);
  }

  async findElements(rawLocator: RawLocator) {
    const locator = this.buildLocator(rawLocator);
    const elements = await this.driver.wait(
      until.elementsLocated(locator),
      this.timeout
    );
    return elements.map(element => wrapElementWithAPI(element, this));
  }

  async findClickableElements(rawLocator: RawLocator) {
    const locator = this.buildLocator(rawLocator);
    const elements = await this.findElements(locator);
    await Promise.all(
      elements.reduce((acc, element) => {
        acc.push(
          // @ts-ignore
          this.driver.wait(until.elementIsVisible(element), this.timeout),
          this.driver.wait(until.elementIsEnabled(element), this.timeout)
        );
        return acc;
      }, [])
    );
    return elements.map(element => wrapElementWithAPI(element, this));
  }

  async clickElement(rawLocator: RawLocator) {
    const locator = this.buildLocator(rawLocator);
    const element = await this.findClickableElement(locator);
    await element.click();
  }

  async clickPoint(rawLocator: RawLocator, x: number, y: number) {
    const locator = this.buildLocator(rawLocator);
    const element = await this.findElement(locator);
    await this.driver
      .actions()
      .move({ origin: element, x, y })
      .click()
      .perform();
  }

  async scrollToElement(element: WebElement) {
    await this.driver.executeScript(
      'arguments[0].scrollIntoView(true)',
      element
    );
  }

  async assertElementNotPresent(rawLocator: RawLocator) {
    const locator = this.buildLocator(rawLocator);
    let dataTab;
    try {
      dataTab = await this.findElement(locator);
    } catch (err) {
      assert(
        err instanceof webdriverError.NoSuchElementError ||
          err instanceof webdriverError.TimeoutError
      );
    }
    assert.ok(!dataTab, 'Found element that should not be present');
  }

  // Navigation

  async navigate(page = Driver.PAGES.POPUP) {
    return await this.driver.get(`${this.extensionUrl}/${page}.html`);
  }

  // Metrics

  async collectMetrics() {
    return await this.driver.executeScript(collectMetrics);
  }

  // Window management

  async openNewPage(url: string) {
    const newHandle = await this.driver.switchTo().newWindow('');
    await this.driver.get(url);
    return newHandle;
  }

  async switchToWindow(handle: string) {
    await this.driver.switchTo().window(handle);
  }

  async getAllWindowHandles() {
    return await this.driver.getAllWindowHandles();
  }

  async getWindowHandle() {
    return await this.driver.getWindowHandle();
  }

  async waitUntilXWindowHandles(x: number, delayStep = 1000, timeout = 5000) {
    let timeElapsed = 0;
    let windowHandles = [];
    while (timeElapsed <= timeout) {
      windowHandles = await this.driver.getAllWindowHandles();
      if (windowHandles.length === x) {
        return windowHandles;
      }
      await this.delay(delayStep);
      timeElapsed += delayStep;
    }
    throw new Error('waitUntilXWindowHandles timed out polling window handles');
  }

  async switchToWindowWithTitle(
    title: string,
    initialWindowHandles: string,
    delayStep = 1000,
    timeout = 5000
  ) {
    let windowHandles =
      initialWindowHandles || (await this.driver.getAllWindowHandles());
    let timeElapsed = 0;
    while (timeElapsed <= timeout) {
      for (const handle of windowHandles) {
        await this.driver.switchTo().window(handle);
        const handleTitle = await this.driver.getTitle();
        if (handleTitle === title) {
          return handle;
        }
      }
      await this.delay(delayStep);
      timeElapsed += delayStep;
      // refresh the window handles
      windowHandles = await this.driver.getAllWindowHandles();
    }

    throw new Error(`No window with title: ${title}`);
  }

  async closeAllWindowHandlesExcept(
    exceptions: string[],
    windowHandles: string[]
  ): Promise<void> {
    // eslint-disable-next-line no-param-reassign
    windowHandles = windowHandles || (await this.driver.getAllWindowHandles());

    for (const handle of windowHandles) {
      if (!exceptions.includes(handle)) {
        await this.driver.switchTo().window(handle);
        await this.delay(1000);
        await this.driver.close();
        await this.delay(1000);
      }
    }
  }

  // Error handling

  async verboseReportOnFailure(title: string) {
    const artifactDir = `./test-artifacts/${this.browser}/${title}`;
    const filepathBase = `${artifactDir}/test-failure`;
    await fs.mkdir(artifactDir, { recursive: true });
    const screenshot = await this.driver.takeScreenshot();
    await fs.writeFile(`${filepathBase}-screenshot.png`, screenshot, {
      encoding: 'base64'
    });
    const htmlSource = await this.driver.getPageSource();
    await fs.writeFile(`${filepathBase}-dom.html`, htmlSource);
    const uiState = await this.driver.executeScript(
      // @ts-ignore TODO: modify `window` in global.d.ts
      () => window.getCleanAppState && window.getCleanAppState()
    );
    await fs.writeFile(
      `${filepathBase}-state.json`,
      JSON.stringify(uiState, null, 2)
    );
  }

  async checkBrowserForConsoleErrors() {
    const ignoredLogTypes = ['WARNING'];
    const ignoredErrorMessages = [
      // Third-party Favicon 404s show up as errors
      'favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)',
      // Sentry rate limiting
      'Failed to load resource: the server responded with a status of 429',
      // 4Byte
      'Failed to load resource: the server responded with a status of 502 (Bad Gateway)'
    ];
    const browserLogs = await this.driver.manage().logs().get('browser');
    const errorEntries = browserLogs.filter(
      entry => !ignoredLogTypes.includes(entry.level.toString())
    );
    const errorObjects = errorEntries.map(entry => entry.toJSON());
    return errorObjects.filter(
      entry =>
        !ignoredErrorMessages.some(message => entry.message.includes(message))
    );
  }
}

function collectMetrics() {
  const results: PerformanceResults = {
    paint: {},
    navigation: []
  };

  window.performance
    .getEntriesByType('paint')
    .forEach(({ name, startTime }: PerformanceEntry) => {
      results.paint[name] = startTime;
    });
  window.performance
    .getEntriesByType('navigation')
    // @ts-ignore TODO: remote ts-ignore directive
    .forEach((navigationEntry: PerformanceNavigationTiming) => {
      results.navigation.push({
        domContentLoaded: navigationEntry.domContentLoadedEventEnd,
        load: navigationEntry.loadEventEnd,
        domInteractive: navigationEntry.domInteractive,
        redirectCount: navigationEntry.redirectCount,
        type: navigationEntry.type
      });
    });

  return results;
}
