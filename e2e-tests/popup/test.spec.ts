import { test } from '../fixtures';
import { vaultPassword } from '../common';

test('test', async ({ extensionId, context, page }) => {
  const importAccountPage = await context.newPage();
  await importAccountPage.goto(
    `chrome-extension://${extensionId}/import-account-with-file.html`
  );

  await test
    .expect(
      importAccountPage.getByRole('heading', {
        name: 'Import account from secret key file'
      })
    )
    .toBeVisible();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  await page.getByPlaceholder('Password', { exact: true }).fill(vaultPassword);
  await page.getByRole('button', { name: 'Unlock wallet' }).click();

  await page.getByTestId('menu-open-icon').click();

  const [importAccountPage2] = await Promise.all([
    context.waitForEvent('page'),
    await page.getByText('Import account').click()
  ]);

  await test
    .expect(
      importAccountPage2.getByRole('heading', {
        name: 'Import account from secret key file'
      })
    )
    .toBeVisible();
});
