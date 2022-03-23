import fs from 'fs';
import os from 'os';
import path from 'path';
import { ThenableWebDriver } from 'selenium-webdriver';
import { BuildWebDriver, WebDriverObject } from './types';
import { Builder, until, By } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox';
// @ts-ignore TODO: solve import
import proxy from 'selenium-webdriver/proxy';
import { Browsers, ExtensionBuildPath } from '../constants';

const TEMP_PROFILE_PATH_PREFIX = path.join(
  os.tmpdir(),
  'Casper-Signer-Profile'
);
const HTTPS_PROXY_HOST = '127.0.0.1:8000';

export class FirefoxDriver {
  _driver: ThenableWebDriver;

  static async build({ port }: BuildWebDriver): Promise<WebDriverObject> {
    const templateProfile = fs.mkdtempSync(TEMP_PROFILE_PATH_PREFIX);
    const options = new firefox.Options().setProfile(templateProfile);
    options.setProxy(proxy.manual({ https: HTTPS_PROXY_HOST }));
    options.setAcceptInsecureCerts(true);

    const builder = new Builder()
      .forBrowser(Browsers.firefox)
      .setFirefoxOptions(options);

    if (port) {
      const service = new firefox.ServiceBuilder().setPort(port);
      builder.setFirefoxService(service);
    }

    const driver = builder.build();
    const fxDriver = new FirefoxDriver(driver);
    const extensionId = await fxDriver.installExtension(
      ExtensionBuildPath.firefox
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
