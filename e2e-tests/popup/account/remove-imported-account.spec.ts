import {
  ACCOUNT_NAMES,
  IMPORTED_PEM_ACCOUNT,
  secretKeyPathForPEM
} from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: remove imported account', () => {
  popup(
    'should remove imported account',
    async ({ unlockVault, context, popupPage }) => {
      await unlockVault();

      await popupPage.getByTestId('menu-open-icon').click();

      const [importAccountPage] = await Promise.all([
        context.waitForEvent('page'),
        popupPage.getByText('Import account').click()
      ]);

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
      await fileChooser.setFiles(secretKeyPathForPEM);

      await importAccountPage
        .getByPlaceholder('Account name', { exact: true })
        .fill(ACCOUNT_NAMES.importedPemAccountName);

      await importAccountPage.getByRole('button', { name: 'Import' }).click();

      await popupExpect(
        importAccountPage.getByRole('heading', {
          name: 'Your account was successfully imported'
        })
      ).toBeVisible();

      await importAccountPage.getByRole('button', { name: 'Done' }).click();

      await popupPage.getByTestId('connection-status-modal').click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.importedPemAccountName)
      ).toBeVisible();
      await popupExpect(
        popupPage.getByText(IMPORTED_PEM_ACCOUNT.truncatedPublicKey)
      ).toBeVisible();
      await popupExpect(
        popupPage.getByTestId('import-account-icon')
      ).toBeVisible();

      await popupPage.getByTestId('popover-children-container').nth(2).click();
      await popupPage.getByText('Manage').click();
      await popupExpect(popupPage.getByText('Public key')).toBeVisible();
      await popupExpect(popupPage.getByText('Account hash')).toBeVisible();
      await popupPage.getByTestId('remove-account-icon').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Remove account?' })
      ).toBeVisible();
      await popupPage.getByRole('button', { name: 'Remove' }).click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.importedPemAccountName)
      ).toBeHidden();

      await popupPage.getByTestId('connection-status-modal').click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.importedPemAccountName)
      ).toBeHidden();
    }
  );
});
