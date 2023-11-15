import { popup, popupExpect } from '../../fixtures';
import { ACCOUNT_NAMES } from '../../common';

popup.describe.skip('Popup UI: lock/unlock vault', () => {
  popup(
    'should unlock and lock vault',
    async ({ popupPage, unlockVault, lockVault }) => {
      await popupExpect(
        popupPage.getByText('Your wallet is locked')
      ).toBeVisible();

      await unlockVault();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.defaultFirstAccountName)
      ).toBeVisible();

      await lockVault();

      await popupExpect(
        popupPage.getByText('Your wallet is locked')
      ).toBeVisible();
    }
  );
});
