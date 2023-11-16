import { popup, popupExpect } from '../../fixtures';
import { ACCOUNT_NAMES } from '../../constants';

popup.describe('Popup UI: lock/unlock/reset wallet', () => {
  popup(
    'should unlock and lock wallet',
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

  popup('should reset wallet', async ({ context, popupPage, extensionId }) => {
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupExpect(
      popupPage.getByText('Your wallet is locked')
    ).toBeVisible();

    await popupPage.getByRole('button', { name: 'Reset wallet' }).click();

    await popupExpect(
      popupPage.getByRole('heading', {
        name: 'Are you sure you want to reset your wallet?'
      })
    ).toBeVisible();
    await popupExpect(
      popupPage.getByRole('button', { name: 'Reset wallet' })
    ).toBeDisabled();

    await popupPage.getByText('I’ve read and understand the above').click();
    await popupExpect(
      popupPage.getByRole('button', { name: 'Reset wallet' })
    ).toBeEnabled();

    const [onboardingPage] = await Promise.all([
      context.waitForEvent('page'),
      popupPage.getByRole('button', { name: 'Reset wallet' }).click()
    ]);

    await popupExpect(
      onboardingPage.getByRole('heading', {
        name: 'Ready to create your new wallet?'
      })
    ).toBeVisible();
  });
});
