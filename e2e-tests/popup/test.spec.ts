import { test } from '../fixtures';
import { DEFAULT_FIRST_ACCOUNT, vaultPassword } from '../common';

test('test', async ({ extensionId, context, page }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  await page.getByPlaceholder('Password', { exact: true }).fill(vaultPassword);
  await page.getByRole('button', { name: 'Unlock wallet' }).click();

  await page.getByTestId('popover-children-container').click();

  const [cspr] = await Promise.all([
    context.waitForEvent('page'),
    await page.getByText('View on CSPR.live').click()
  ]);

  await test
    .expect(cspr.getByText(DEFAULT_FIRST_ACCOUNT.truncatedPublicKey))
    .toBeVisible();
});
