import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: switch account', () => {
  popup(
    'should switch to another account',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.getByTestId('connection-status-modal').click();
      await popupPage.waitForLoadState('networkidle');
      await popupPage.getByText('Account 1').nth(1).click();

      await popupExpect(popupPage.getByText('Account 1')).toBeVisible();

      await popupPage.getByTestId('connection-status-modal').click();
      await popupPage.waitForLoadState('networkidle');
      await popupPage.getByText('Account 2').click();

      await popupExpect(popupPage.getByText('Account 1')).toBeHidden();

      await popupExpect(popupPage.getByText('Account 2')).toBeVisible();
    }
  );
});
