import {
  ACCOUNT_NAMES,
  IMPORTED_TORUS_ACCOUNT,
  torusSecretKeyHex
} from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: import account with file', () => {
  popup('should import torus account', async ({ unlockVault, popupPage }) => {
    await unlockVault();

    await popupPage.getByTestId('menu-open-icon').click();
    await popupPage.getByText('Import Torus account').click();

    await popupExpect(
      popupPage.getByRole('heading', {
        name: 'Import account from Torus Wallet'
      })
    ).toBeVisible();

    await popupPage.getByRole('button', { name: 'Next' }).click();

    await popupPage
      .getByPlaceholder('Secret key', { exact: true })
      .fill(torusSecretKeyHex);
    await popupPage
      .getByPlaceholder('Account name', { exact: true })
      .fill(IMPORTED_TORUS_ACCOUNT.accountName);

    await popupPage.getByRole('button', { name: 'Import' }).click();

    await popupExpect(
      popupPage.getByRole('heading', {
        name: 'Your account was successfully imported'
      })
    ).toBeVisible();

    await popupPage.getByRole('button', { name: 'Done' }).click();

    await popupPage.getByTestId('connection-status-modal').click();

    await popupExpect(
      popupPage.getByText(ACCOUNT_NAMES.importedTorusAccountName)
    ).toBeVisible();
    await popupExpect(
      popupPage.getByText(IMPORTED_TORUS_ACCOUNT.truncatedPublicKey)
    ).toBeVisible();
    await popupExpect(
      popupPage.getByTestId('import-account-icon')
    ).toBeVisible();
  });
});
