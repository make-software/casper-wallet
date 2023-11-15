import { popup, popupExpect } from '../../fixtures';
// import { ACCOUNT_NAMES, IMPORTED_ACCOUNT, secretKeyPath } from '../../common';

popup.describe('Popup UI: import account with file', () => {
  popup(
    'should import account with file',
    async ({ unlockVault, context, page, extensionId, browser }) => {
      // const newContext = await browser.newContext();
      // const page2 = await newContext.newPage();
      await page.goto(
        `chrome-extension://${extensionId}/import-account-with-file.html`
      );
      // await unlockVault();

      // await page.getByTestId('menu-open-icon').click();

      // const [importAccountPage] = await Promise.all([
      //   context.waitForEvent('page'),
      //   page.getByText('Import account').click()
      // ]);

      // const fileChooserPromise = page.waitForEvent('filechooser');

      await popupExpect(
        page.getByRole('heading', {
          name: 'Import account from secret key file'
        })
      ).toBeVisible();

      // await page.getByRole('button', { name: 'Upload your file' }).click();

      // const fileChooser = await fileChooserPromise;
      // await fileChooser.setFiles(secretKeyPath);
      //
      // await importAccountPage
      //   .getByPlaceholder('Account name', { exact: true })
      //   .fill(ACCOUNT_NAMES.importedAccountName);
      //
      // await importAccountPage.getByRole('button', { name: 'Import' }).click();
      //
      // await popupExpect(
      //   importAccountPage.getByRole('heading', {
      //     name: 'Your account was successfully imported'
      //   })
      // ).toBeVisible();
      //
      // await importAccountPage.getByRole('button', { name: 'Done' }).click();

      // await page.getByTestId('connection-status-modal').click();
      //
      // await popupExpect(
      //   page.getByText(ACCOUNT_NAMES.importedAccountName)
      // ).toBeVisible();
      // await popupExpect(
      //   page.getByText(IMPORTED_ACCOUNT.truncatedPublicKey)
      // ).toBeVisible();
      // await popupExpect(
      //   page.getByText('Imported', { exact: true })
      // ).toBeVisible();
    }
  );
});
