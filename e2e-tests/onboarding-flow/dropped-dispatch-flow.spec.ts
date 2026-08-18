import { twentyFourWordsSecretPhrase } from '../constants';
import { DISPATCH_FAILED, breakTransport } from '../error-surface';
import { onboarding, onboardingExpect } from '../fixtures';

// The onboarding half of the guards. All three writes are the sole source of
// what the screen does next, and the router catches none of them:
// `keysDoesExist` stays false on a dropped `initKeys`; on a dropped `initVault`
// it is already true, so the success page would render over a vault that was
// never created; and a dropped `recoverVault` used to close the tab regardless,
// taking the banner down with the tree it is mounted in.
//
// The break is aimed at one action type — the rest of the flow rides the same
// transport and would fail long before the button under test is reached. Every
// screen here is reached through the SPA router, so the patch survives to the
// click.
onboarding.describe('Onboarding UI: a dropped write is not silent', () => {
  onboarding(
    'should keep the password screen when initKeys is dropped',
    async ({ page, createOnboardingPassword }) => {
      await breakTransport(page, ['INIT_KEYS_SAGA']);

      await createOnboardingPassword();

      await onboardingExpect(page.getByText(DISPATCH_FAILED)).toBeVisible();
      await onboardingExpect(page).toHaveURL(/.*create-vault-password/);

      // The staying-put is not the guard's doing — `keysDoesExist` is false
      // either way, so `NoVaultRoutes` keeps this screen up on its own. What the
      // guard decides is whether the button survives: unguarded, `isSubmitted`
      // latches on a write that never landed and the only button on the screen
      // is dead for good, with the banner pointing at it.
      await onboardingExpect(
        page.getByRole('button', { name: 'Create password' })
      ).toBeEnabled();
    }
  );

  onboarding(
    'should keep the confirmation screen when initVault is dropped',
    async ({
      page,
      createOnboardingPassword,
      createSecretPhrase,
      copySecretPhrase,
      confirmSecretPhraseSuccess
    }) => {
      await createOnboardingPassword();
      await createSecretPhrase();

      const phrase = await copySecretPhrase();

      await breakTransport(page, ['INIT_VAULT_SAGA']);

      await confirmSecretPhraseSuccess(phrase);

      await onboardingExpect(page.getByText(DISPATCH_FAILED)).toBeVisible();
      await onboardingExpect(page).not.toHaveURL(
        /.*confirm-secret-phrase-success/
      );

      // The in-flight gate must let go on a false verdict, or the banner would
      // be pointing at a button that can never be pressed again.
      await onboardingExpect(
        page.getByRole('button', { name: 'Confirm' })
      ).toBeEnabled();
    }
  );

  onboarding(
    'should keep the onboarding tab open when recoverVault is dropped',
    async ({ page, createOnboardingPassword }) => {
      await createOnboardingPassword();

      await page
        .getByRole('button', {
          name: 'Import an existing secret recovery phrase'
        })
        .click();

      await page
        .getByPlaceholder('e.g. Bobcat Lemon Blanket…')
        .fill(twentyFourWordsSecretPhrase);

      await page.getByRole('button', { name: 'Next' }).click();

      await onboardingExpect(
        page.getByText('Select accounts to recover')
      ).toBeVisible();

      await page.getByTestId('select-account-0').click();

      await breakTransport(page, ['RECOVER_VAULT_SAGA']);

      await page
        .getByRole('button', { name: 'Recover selected accounts' })
        .click();

      // What this pins is that the banner reaches THIS tree — the recover screen
      // is the one place a surfaced error has to survive a `closeActiveTab`.
      //
      // It does NOT pin the close-gate itself, and cannot: `closeActiveTab` is
      // inert under Playwright. The success-path specs prove it — they
      // `page.goto` the popup on this same `page` right after a recover that
      // closes the tab in a real browser, which would throw on a closed target.
      // So the gate at `select-accounts-to-recover/index.tsx` is only held by
      // review; reverting it to `.finally` leaves this case green.
      await onboardingExpect(page.getByText(DISPATCH_FAILED)).toBeVisible();
      await onboardingExpect(
        page.getByText('Select accounts to recover')
      ).toBeVisible();
    }
  );
});
