import { test } from '../fixtures';

test('test', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://playwright.dev/');

  const [github] = await Promise.all([
    context.waitForEvent('page'),
    await page.locator("//a[@aria-label='GitHub repository']").click()
  ]);

  await test.expect(github.locator('#user-content--playwright')).toBeVisible();
});
