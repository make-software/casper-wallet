import { ACCOUNT_NAMES } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: rename account', () => {
  popup(
    'should rename account from account popover',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.getByTestId('connection-status-modal').click();
      await popupPage.getByTestId('popover-children-container').nth(0).click();

      await popupPage.getByText('Rename').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Rename account' })
      ).toBeVisible();

      await popupPage
        .getByPlaceholder('New account name', { exact: true })
        .fill(ACCOUNT_NAMES.renamedAccountName);
      await popupPage.getByRole('button', { name: 'Update' }).click();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: ACCOUNT_NAMES.renamedAccountName
        })
      ).toBeVisible();

      await popupPage.getByText('Close').click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.renamedAccountName)
      ).toBeVisible();
    }
  );
  popup(
    'should rename account from manage page',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.getByTestId('connection-status-modal').click();
      await popupPage.getByTestId('popover-children-container').nth(0).click();

      await popupPage.getByText('Manage').click();

      await popupExpect(popupPage.getByText('Public key')).toBeVisible();
      await popupPage.getByTestId('rename-account-icon').click();
      await popupExpect(
        popupPage.getByRole('heading', { name: 'Rename account' })
      ).toBeVisible();

      await popupPage
        .getByPlaceholder('New account name', { exact: true })
        .fill(ACCOUNT_NAMES.renamedAccountName);
      await popupPage.getByRole('button', { name: 'Update' }).click();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: ACCOUNT_NAMES.renamedAccountName
        })
      ).toBeVisible();

      await popupPage.getByText('Close').click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.renamedAccountName)
      ).toBeVisible();
    }
  );
});
