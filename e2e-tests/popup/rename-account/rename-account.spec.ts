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

      // Scoped to the header banner: react-router 7 no longer unmounts the
      // outgoing route synchronously with the incoming one (v6 did), so the
      // account-settings page's heading can still be in the DOM for a few ms
      // after navigating home, making an unscoped getByText ambiguous.
      await popupExpect(
        popupPage
          .getByRole('banner')
          .getByText(ACCOUNT_NAMES.renamedAccountName)
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

      // Scoped to the header banner: react-router 7 no longer unmounts the
      // outgoing route synchronously with the incoming one (v6 did), so the
      // account-settings page's heading can still be in the DOM for a few ms
      // after navigating home, making an unscoped getByText ambiguous.
      await popupExpect(
        popupPage
          .getByRole('banner')
          .getByText(ACCOUNT_NAMES.renamedAccountName)
      ).toBeVisible();
    }
  );
});
