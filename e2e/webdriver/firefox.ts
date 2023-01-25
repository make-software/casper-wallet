import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as firefox from 'selenium-webdriver/firefox';
import { ThenableWebDriver, Browser } from 'selenium-webdriver';
import { Builder, until, By } from 'selenium-webdriver';

import { WebDriverObject } from './types';
import { ExtensionBuildPath } from '../../constants';
import { SeleniumPort } from './constants';

const TEMP_PROFILE_PATH_PREFIX = path.join(
  os.tmpdir(),
  'Casper-Signer-Profile'
);

export class FirefoxDriver {
  _driver: ThenableWebDriver;

  static async build(
    port: number | undefined,
    headless: boolean,
    seleniumHost: string,
    seleniumPort?: string
  ): Promise<WebDriverObject> {
    const templateProfile = fs.mkdtempSync(TEMP_PROFILE_PATH_PREFIX);
    const options = new firefox.Options().setProfile(templateProfile);

    options.setAcceptInsecureCerts(true);
    options.setPreference('dom.events.asyncClipboard.read', true);

    const builder = new Builder()
      .forBrowser(Browser.FIREFOX)
      .setFirefoxOptions(options);

    if (port) {
      const service = new firefox.ServiceBuilder().setPort(port);
      builder.setFirefoxService(service);
    }

    if (headless) {
      builder.usingServer(
        `http://${seleniumHost}:${seleniumPort || SeleniumPort.Firefox}/`
      );
    }

    const driver = builder.build();
    const fxDriver = new FirefoxDriver(driver);
    const extensionId = await fxDriver.installExtension(
      ExtensionBuildPath.Firefox
    );
    const internalExtensionId = await fxDriver.getInternalId();

    return {
      driver,
      extensionId,
      extensionUrl: `moz-extension://${internalExtensionId}`
    };
  }

  constructor(driver: ThenableWebDriver) {
    this._driver = driver;
  }

  async installExtension(addonPath: string): Promise<string> {
    // @ts-ignore TODO: clarify firefox driver type
    return await this._driver.installAddon(addonPath, true);
  }

  async getInternalId() {
    await this._driver.get('about:debugging#addons');
    return await this._driver
      .wait(
        until.elementLocated(By.xpath("//dl/div[contains(., 'UUID')]/dd")),
        1000
      )
      .getText();
  }
}
