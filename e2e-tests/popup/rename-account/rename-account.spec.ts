import { popup, popupExpect } from '../../fixtures';
import { ACCOUNT_NAMES } from '../../common';

popup.describe('Popup UI: rename account', () => {
  popup(
    'should rename account from account popover',
    async ({ page, unlockVault }) => {
      await unlockVault();

      await page.getByTestId('popover-children-container').click();

      await page.getByText('Rename').click();

      await popupExpect(
        page.getByRole('heading', { name: 'Rename account' })
      ).toBeVisible();

      await page
        .getByPlaceholder('New account name', { exact: true })
        .fill(ACCOUNT_NAMES.renamedAccountName);
      await page.getByRole('button', { name: 'Update' }).click();

      await popupExpect(
        page.getByRole('heading', { name: ACCOUNT_NAMES.renamedAccountName })
      ).toBeVisible();

      await page.getByText('Close').click();

      await popupExpect(
        page.getByText(ACCOUNT_NAMES.renamedAccountName)
      ).toBeVisible();
    }
  );
});
