import { ACCOUNT_NAMES } from '../../constants';
import { DISPATCH_FAILED, breakTransport } from '../../error-surface';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: lock/unlock/reset wallet', () => {
  popup(
    'should unlock and lock wallet',
    async ({ popupPage, unlockVault, lockVault }) => {
      await popupExpect(
        popupPage.getByText('Your wallet is locked')
      ).toBeVisible();

      await unlockVault();

      await popupExpect(popupPage.getByText('Unlocking...')).toBeVisible();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.defaultFirstAccountName)
      ).toBeVisible();

      await lockVault();

      await popupExpect(
        popupPage.getByText('Your wallet is locked')
      ).toBeVisible();
    }
  );

  popup('should reset wallet', async ({ context, popupPage }) => {
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

  popup(
    'should keep the user on the confirmation page when the reset dispatch is dropped',
    async ({ popupPage }) => {
      // Without the guard on the verdict, `closeWindowByReloadExtension` runs
      // regardless: the extension reloads into onboarding and tells the user
      // their wallet was reset while the vault cipher is still on disk — and
      // takes the banner down with the page.
      await popupPage.getByRole('button', { name: 'Reset wallet' }).click();
      await popupPage.getByText('I’ve read and understand the above').click();

      await breakTransport(popupPage);

      await popupPage.getByRole('button', { name: 'Reset wallet' }).click();

      await popupExpect(popupPage.getByText(DISPATCH_FAILED)).toBeVisible();
      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'Are you sure you want to reset your wallet?'
        })
      ).toBeVisible();
    }
  );

  popup(
    'should lock wallet for 5 minutes when user types wrong password 5 times',
    async ({ popupPage }) => {
      await popupExpect(
        popupPage.getByText('Your wallet is locked')
      ).toBeVisible();

      await popupPage
        .getByPlaceholder('Password', { exact: true })
        .fill('wrong password');

      for (let i = 0; i < 5; i++) {
        await popupPage.getByRole('button', { name: 'Unlock wallet' }).click();
      }

      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'Please wait before the next attempt to unlock your wallet'
        })
      ).toBeVisible();
    }
  );
});
