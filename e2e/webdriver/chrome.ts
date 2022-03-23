import { Builder, ThenableWebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
// @ts-ignore TODO: solve import
import proxy from 'selenium-webdriver/proxy';

import { Browsers, ExtensionBuildPath, extensionName } from '../constants';
import { BuildWebDriver, WebDriverObject } from './types';

const HTTPS_PROXY_HOST = '127.0.0.1:8000';

export class ChromeDriver {
  _driver: ThenableWebDriver;

  static async build({ port }: BuildWebDriver): Promise<WebDriverObject> {
    const args = [`load-extension=${ExtensionBuildPath.chrome}`];

    const options = new chrome.Options().addArguments(args.join(' '));
    options.setProxy(proxy.manual({ https: HTTPS_PROXY_HOST }));
    options.setAcceptInsecureCerts(true);
    const builder = new Builder()
      .forBrowser(Browsers.chrome)
      .setChromeOptions(options);
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
