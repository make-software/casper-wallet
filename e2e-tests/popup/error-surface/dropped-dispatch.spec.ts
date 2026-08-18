import { Page } from '@playwright/test';

import {
  DISPATCH_FAILED,
  WINDOW_FAILED,
  breakTransport,
  breakWindowCreation
} from '../../error-surface';
import { popup, popupExpect } from '../../fixtures';

async function clickMenuItem(page: Page, name: string) {
  await page.getByTestId('menu-open-icon').click();
  await page.getByText(name, { exact: true }).click();
}

// `unlockVault` returns before the unlock has actually completed — it only waits
// for network idle, and the flow finishes through further dispatches from this
// page. Breaking the transport before then breaks the unlock itself and the page
// sits on the lock screen forever, so wait for the unlocked UI first.
async function waitForUnlockedHome(page: Page) {
  await popupExpect(page.getByTestId('menu-open-icon')).toBeVisible();
}

popup.describe('Popup UI: dropped dispatch error surface', () => {
  popup(
    'tells the user when the export-keys dispatch never reaches the background',
    async ({ popupPage, unlockVault, context }) => {
      await unlockVault();
      await waitForUnlockedHome(popupPage);
      await breakTransport(popupPage);

      const pagesBefore = context.pages().length;

      await clickMenuItem(popupPage, 'Download account keys');

      await popupExpect(popupPage.getByText(DISPATCH_FAILED)).toBeVisible();
      // The dispatch never arrived, so the saga that opens the window never ran.
      popupExpect(context.pages().length).toBe(pagesBefore);
    }
  );

  // Dedupe of repeated failures is covered by `ui-error-channel.test.ts` and not
  // here: the banner is `position: fixed; top: 0` with a tooltip z-index, so once
  // a row is up it covers the header — measured at 1280x77 over a menu icon at
  // y=24..48, with `elementFromPoint` returning the banner. A second click on the
  // menu cannot land until the row is dismissed.
  popup(
    'shows no banner for an action that is not on the surfaced list',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();
      await waitForUnlockedHome(popupPage);
      await breakTransport(popupPage);

      await clickMenuItem(popupPage, 'Theme');
      await popupPage.getByText('Dark', { exact: true }).click();

      // Logged, never shown: a banner on every dropped dispatch would train the
      // user to ignore the banner.
      await popupExpect(popupPage.getByText(DISPATCH_FAILED)).toHaveCount(0);
    }
  );

  popup(
    'lets the row be dismissed, and brings it back on the next failure',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();
      await waitForUnlockedHome(popupPage);
      await breakTransport(popupPage);

      await clickMenuItem(popupPage, 'Download account keys');
      await popupExpect(popupPage.getByText(DISPATCH_FAILED)).toBeVisible();

      await popupPage.getByRole('button', { name: 'Dismiss' }).click();
      await popupExpect(popupPage.getByText(DISPATCH_FAILED)).toHaveCount(0);

      await clickMenuItem(popupPage, 'Download account keys');
      await popupExpect(popupPage.getByText(DISPATCH_FAILED)).toBeVisible();
    }
  );

  popup(
    'tells the user when the import-account window fails to open',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();
      await waitForUnlockedHome(popupPage);
      await breakWindowCreation(popupPage);

      await clickMenuItem(popupPage, 'Import account');

      await popupExpect(popupPage.getByText(WINDOW_FAILED)).toBeVisible();
    }
  );
});
