import { Browser } from 'selenium-webdriver';
import { Driver } from './driver';
import { ChromeDriver } from './chrome';
import { FirefoxDriver } from './firefox';

import { BuildWebDriver, Browser as BrowserString } from './types';

export async function buildWebDriver(
  buildWebDriver: BuildWebDriver = {}
): Promise<Driver> {
  const browser: BrowserString =
    buildWebDriver.browser ||
    (process.env.SELENIUM_BROWSER as BrowserString) ||
    'chrome';

  const { driver: seleniumDriver, extensionUrl } = await buildBrowserWebDriver({
    ...buildWebDriver,
    browser
  });

  return new Driver(seleniumDriver, browser, extensionUrl);
}

async function buildBrowserWebDriver({ browser, port }: BuildWebDriver) {
  switch (browser) {
    case Browser.CHROME: {
      return await ChromeDriver.build(port);
    }
    case Browser.FIREFOX: {
      return await FirefoxDriver.build(port);
    }
    default: {
      throw new Error(`Unrecognized browser: ${browser}`);
    }
  }
}
