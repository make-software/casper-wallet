import * as chrome from 'selenium-webdriver/chrome';
import { Builder, ThenableWebDriver, Browser } from 'selenium-webdriver';
import remote from 'selenium-webdriver/remote';

import { WebDriverObject } from './types';
import { extensionName } from '../../constants';
import { SeleniumPort } from './constants';

export class ChromeDriver {
  _driver: ThenableWebDriver;

  static async build(
    port: number | undefined,
    headless: boolean,
    seleniumHost: string,
    seleniumPort?: string
  ): Promise<WebDriverObject> {
    const options = new chrome.Options();

    // Allow Selenium to use Chrome's clipboard for tests
    // options.setUserPreferences({
    //   profile: {
    //     content_settings: {
    //       exceptions: {
    //         clipboard: {
    //           '[*.],*': {
    //             expiration: '0',
    //             last_modified: Date.now(),
    //             model: 0,
    //             setting: 1
    //           }
    //         }
    //       }
    //     }
    //   }
    // });
    options.addExtensions('chrome.crx');
    options.setAcceptInsecureCerts(true);

    const builder = new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options);

    if (headless) {
      builder.usingServer(
        `http://${seleniumHost}:${seleniumPort || SeleniumPort.Chrome}/`
      );
    }

    const service = new chrome.ServiceBuilder();

    // Enables Chrome logging. Default: enabled
    // Especially useful for discovering why Chrome has crashed, but can also
    // be useful for revealing console errors (from the page or background).
    if (process.env.ENABLE_CHROME_LOGGING !== 'false') {
      // @ts-ignore
      service.setStdio('inherit').enableChromeLogging();
    }
    if (port) {
      service.setPort(port);
    }
    builder.setChromeService(service);

    const driver = builder.build();
    const chromeDriver = new ChromeDriver(driver);
    const extensionId = await chromeDriver.getExtensionIdByName(extensionName);
    driver.setFileDetector(new remote.FileDetector());

    return {
      driver,
      extensionUrl: `chrome-extension://${extensionId}`
    };
  }

  constructor(driver: ThenableWebDriver) {
    this._driver = driver;
  }

  async getExtensionIdByName(
    extensionName: string
  ): Promise<string | undefined> {
    await this._driver.get('chrome://extensions');
    return await this._driver.executeScript(`
      const extensions = document.querySelector("extensions-manager").shadowRoot
        .querySelector("extensions-item-list").shadowRoot
        .querySelectorAll("extensions-item")

      for (let i = 0; i < extensions.length; i++) {
        const extension = extensions[i].shadowRoot
        const name = extension.querySelector('#name').textContent
        if (name === "${extensionName}") {
          return extensions[i].getAttribute("id")
        }
      }

      return undefined
    `);
  }
}
