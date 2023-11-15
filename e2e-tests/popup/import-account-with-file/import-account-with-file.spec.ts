import { popup, popupExpect } from '../../fixtures';
import { ACCOUNT_NAMES, IMPORTED_ACCOUNT, secretKeyPath } from '../../common';

popup.describe('Popup UI: import account with file', () => {
  popup(
    'should import account with file',
    async ({ unlockVault, popupPage, context }) => {
      await unlockVault(popupPage);

      await popupPage.getByTestId('menu-open-icon').click();

      const newPagePromise = context.waitForEvent('page');
      await popupPage.getByText('Import account').click();
      const importAccountPage = await newPagePromise;

      const fileChooserPromise = importAccountPage.waitForEvent('filechooser');

      await popupExpect(
        importAccountPage.getByRole('heading', {
          name: 'Import account from secret key file'
        })
      ).toBeVisible();

      await importAccountPage
        .getByRole('button', { name: 'Upload your file' })
        .click();

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(secretKeyPath);

      await importAccountPage
        .getByPlaceholder('Account name', { exact: true })
        .fill(ACCOUNT_NAMES.importedAccountName);

      await importAccountPage.getByRole('button', { name: 'Import' }).click();

      await popupExpect(
        importAccountPage.getByRole('heading', {
          name: 'Your account was successfully imported'
        })
      ).toBeVisible();

      await importAccountPage.getByRole('button', { name: 'Done' }).click();

      await popupPage.getByTestId('connection-status-modal').click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.importedAccountName)
      ).toBeVisible();
      await popupExpect(
        popupPage.getByText(IMPORTED_ACCOUNT.truncatedPublicKey)
      ).toBeVisible();
      await popupExpect(
        popupPage.getByText('Imported', { exact: true })
      ).toBeVisible();
    }
  );
});
