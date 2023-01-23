import { ThenableWebDriver, WebElement } from 'selenium-webdriver';

export type RawLocator = string | LocatorObject;
export type Key = string | number | Promise<string | number>;
export type Browser = 'chrome' | 'firefox' | 'safari';

export interface BuildWebDriver {
  port?: number;
  browser: Browser;
  headless: boolean;
}

export interface DriverKey {
  BACK_SPACE: string;
  ENTER: string;
}

interface LocatorObject {
  value?: string;
  xpath?: string;
  text?: string;
  css?: string;
  tag?: string;
}

export interface WebDriverObject {
  driver: ThenableWebDriver;
  extensionUrl: string;
  extensionId?: string;
}

export interface IWebElementWithAPI extends WebElement {
  fill: (input: Key) => Promise<void>;
  press: (key: Key) => Promise<void>;
  waitForElementState: (state: string, timeout: number) => Promise<void>;
}

// Metrics

interface NavigationResult {
  domContentLoaded: number;
  load: number;
  domInteractive: number;
  redirectCount: number;
  type: string;
}

export interface PerformanceResults {
  paint: {
    [key: string]: number;
  };
  navigation: NavigationResult[];
}
