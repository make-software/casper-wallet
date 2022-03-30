import { Browser } from 'selenium-webdriver';
import { Driver } from './driver';
import { ChromeDriver } from './chrome';
import { FirefoxDriver } from './firefox';

import { BuildWebDriver } from './types';

export async function buildWebDriver(
  buildWebDriver: BuildWebDriver = {}
): Promise<Driver> {
  const browser =
    buildWebDriver.browser || process.env.SELENIUM_BROWSER || 'chrome';

  const { driver: seleniumDriver, extensionUrl } = await buildBrowserWebDriver(
    browser,
    buildWebDriver
  );

  return new Driver(seleniumDriver, browser, extensionUrl);
}

async function buildBrowserWebDriver(
  browser: string | undefined,
  webDriverOptions: BuildWebDriver
) {
  switch (browser) {
    case Browser.CHROME: {
      return await ChromeDriver.build(webDriverOptions);
    }
    case Browser.FIREFOX: {
      return await FirefoxDriver.build(webDriverOptions);
    }
    default: {
      throw new Error(`Unrecognized browser: ${browser}`);
    }
  }
}
