import { strict as assert } from 'assert';
import { buildWebDriver } from '../webdriver';

describe('Selenium', () => {
  it('should open browser with installed extension', async () => {
    const driver = await buildWebDriver();
    await driver.navigate();
    const path = await driver.waitForSelector({
      css: 'code',
      text: 'src/'
    });

    assert.equal(await path.getText(), 'src/pages/Popup/components/Popup.jsx');
    await driver.driver.close();
  });
});
