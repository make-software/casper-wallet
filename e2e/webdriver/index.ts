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
  const host = process.env.SELENIUM_HOST || 'localhost';

  const { driver: seleniumDriver, extensionUrl } = await buildBrowserWebDriver({
    ...buildWebDriver,
    browser,
    headless,
    host
  });

  return new Driver(seleniumDriver, browser, extensionUrl);
}

async function buildBrowserWebDriver({
  browser,
  port,
  headless,
  host
}: BuildWebDriver) {
  switch (browser) {
    case Browser.CHROME: {
      return await ChromeDriver.build(port, headless, host);
    }
    case Browser.FIREFOX: {
      return await FirefoxDriver.build(port, headless, host);
    }
    default: {
      throw new Error(`Unrecognized browser: ${browser}`);
    }
  }
}
