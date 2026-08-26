import { PLAYGROUND_URL, twentyFourWordsSecretPhrase } from '../constants';
import { onboarding, onboardingExpect } from '../fixtures';
import {
  markServiceWorker,
  readServiceWorkerMark,
  stopServiceWorker
} from '../service-worker';

const SETTLEMENT_KEY = '__casperConnectSettlement';

type Settlement = { accepted: boolean } | { error: string };

// The one ordering that matters, and the only one an in-memory `requests` map
// cannot survive: the worker is already dead and the event that WAKES it is the
// approval window closing. A saga cannot rebuild the descriptor from the open
// windows here — the window is gone from `windows.getAll` by the time anything
// runs — so the mirror in `storage.session`, hydrated in the store preload, is
// the only thing that can still tell the dapp its request was cancelled.
//
// Two things make this test real, and both are easy to void:
//   - It must NOT run against a MOCK_STATE build. `get-main-store.ts`
//     short-circuits the session READ under that flag, so the mirror never
//     hydrates and the result says nothing about the fix. Hence the wallet is
//     set up through onboarding, and this directory has its own npm script.
//   - Nothing may touch the approval page. `useUserActivityTracker` is still
//     mounted with its pre-kill listeners, and one mouse move over that page
//     wakes the worker before the close — which is why the window is closed
//     programmatically rather than through its title-bar X.
onboarding.describe('Request lifecycle: service worker restart', () => {
  onboarding(
    'should cancel a connect request when its window closes while the worker is dead',
    async ({ page, context, extensionId, createOnboardingPassword }) => {
      onboarding.setTimeout(180000);

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
      await page
        .getByRole('button', { name: 'Recover selected accounts' })
        .click();

      // `closeActiveTab` is inert under Playwright, so the recover screen has no
      // success state to wait on. An unlocked popup is the signal instead.
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await onboardingExpect(page.getByTestId('menu-open-icon')).toBeVisible();

      await page.goto(PLAYGROUND_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(
        () => typeof (window as any).CasperWalletProvider !== 'undefined',
        null,
        { timeout: 10000 }
      );

      // Driven from the page rather than from a playground button so the test
      // holds the promise itself: the assertion is about it SETTLING, and a
      // button click leaves it somewhere unreachable.
      const [approvalPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 15000 }),
        page.evaluate(key => {
          const scope = window as any;

          scope[key] = undefined;
          scope
            .CasperWalletProvider()
            .requestConnection()
            .then(
              (accepted: boolean) => {
                scope[key] = { accepted };
              },
              (error: unknown) => {
                scope[key] = { error: String(error) };
              }
            );
        }, SETTLEMENT_KEY)
      ]);

      // Rendering this screen took a background round trip, so the descriptor is
      // registered and the mirror written well before the kill.
      await onboardingExpect(
        approvalPage.getByRole('button', { name: 'Next' })
      ).toBeVisible();

      onboardingExpect(
        await page.evaluate(key => (window as any)[key], SETTLEMENT_KEY)
      ).toBeUndefined();

      const generation = await markServiceWorker(context);

      await stopServiceWorker(context, page);
      await approvalPage.close();

      // Short on purpose. Without the mirror this never settles at all — the
      // dapp waits out the SDK's own 30 minute timeout.
      await page.waitForFunction(
        key => (window as any)[key] !== undefined,
        SETTLEMENT_KEY,
        { timeout: 15000 }
      );

      const settlement = (await page.evaluate(
        key => (window as any)[key],
        SETTLEMENT_KEY
      )) as Settlement;

      onboardingExpect(settlement).toEqual({ accepted: false });

      // The cancel came from a worker that had lost its memory: nothing between
      // the stop and the close could have kept `requests` alive in it.
      onboardingExpect(await readServiceWorkerMark(context)).not.toBe(
        generation
      );
    }
  );
});
