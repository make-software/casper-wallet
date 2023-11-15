import { test } from '../fixtures';
import { vaultPassword } from '../common';

test.skip('test', async ({ extensionId, context, page }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  await page.getByPlaceholder('Password', { exact: true }).fill(vaultPassword);
  await page.getByRole('button', { name: 'Unlock wallet' }).click();

  await page.getByTestId('popover-children-container').click();

  const [importAccount] = await Promise.all([
    context.waitForEvent('page'),
    await page.getByText('View on CSPR.live').click()
  ]);

  await test
    .expect(
      importAccount.getByRole('heading', {
        name: 'Import account from secret key file'
      })
    )
    .toBeVisible();
});
