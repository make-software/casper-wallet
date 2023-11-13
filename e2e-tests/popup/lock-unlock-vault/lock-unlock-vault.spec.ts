import { popup, popupExpect } from '../../fixtures';
import { ACCOUNT_NAMES } from '../../common';

popup.describe('Popup UI: lock/unlock vault', () => {
  popup(
    'should unlock and lock vault',
    async ({ page, unlockVault, lockVault }) => {
      await popupExpect(page.getByText('Your wallet is locked')).toBeVisible();

      await unlockVault();

      await popupExpect(
        page.getByText(ACCOUNT_NAMES.defaultAccountName)
      ).toBeVisible();

      await lockVault();

      await popupExpect(page.getByText('Your wallet is locked')).toBeVisible();
    }
  );
});
