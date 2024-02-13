import {
  ACCOUNT_NAMES,
  IMPORTED_CER_ACCOUNT,
  IMPORTED_PEM_ACCOUNT,
  secretKeyPathForCER,
  secretKeyPathForPEM
} from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: import account with file', () => {
  popup(
    'should import account via .pem file',
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
        popupPage.getByText('Imported', { exact: true })
      ).toBeVisible();
    }
  );
  popup(
    'should import account via .cer file',
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
      await fileChooser.setFiles(secretKeyPathForCER);

      await importAccountPage
        .getByPlaceholder('Account name', { exact: true })
        .fill(ACCOUNT_NAMES.importedCerAccountName);

      await importAccountPage.getByRole('button', { name: 'Import' }).click();

      await popupExpect(
        importAccountPage.getByRole('heading', {
          name: 'Your account was successfully imported'
        })
      ).toBeVisible();

      await importAccountPage.getByRole('button', { name: 'Done' }).click();

      await popupPage.getByTestId('connection-status-modal').click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.importedCerAccountName)
      ).toBeVisible();
      await popupExpect(
        popupPage.getByText(IMPORTED_CER_ACCOUNT.truncatedPublicKey)
      ).toBeVisible();
      await popupExpect(
        popupPage.getByText('Imported', { exact: true })
      ).toBeVisible();
    }
  );
});
