import { Browser } from 'selenium-webdriver';
import { Driver } from './driver';
import { ChromeDriver } from './chrome';
import { FirefoxDriver } from './firefox';

import { BuildWebDriver, Browser as BrowserString } from './types';

export async function buildWebDriver(
  buildWebDriver?: BuildWebDriver
): Promise<Driver> {
  const browser: BrowserString =
    buildWebDriver?.browser ||
    (process.env.SELENIUM_BROWSER as BrowserString) ||
    'chrome';
  const headless = !!process.env.SELENIUM_HEADLESS;
  const seleniumHost = process.env.SELENIUM_HOST || 'localhost';
  const seleniumPort = process.env.SELENIUM_PORT;

  const { driver: seleniumDriver, extensionUrl } = await buildBrowserWebDriver({
    ...buildWebDriver,
    browser,
    headless,
    seleniumHost,
    seleniumPort
  });

  return new Driver(seleniumDriver, browser, extensionUrl);
}

async function buildBrowserWebDriver({
  browser,
  port,
  headless,
  seleniumHost,
  seleniumPort
}: BuildWebDriver) {
  switch (browser) {
    case Browser.CHROME: {
      return await ChromeDriver.build(
        port,
        headless,
        seleniumHost,
        seleniumPort
      );
    }
    case Browser.FIREFOX: {
      return await FirefoxDriver.build(
        port,
        headless,
        seleniumHost,
        seleniumPort
      );
    }
    default: {
      throw new Error(`Unrecognized browser: ${browser}`);
    }
  }
}
