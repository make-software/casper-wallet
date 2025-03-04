import { Page } from '@playwright/test';

import { ACCOUNT_NAMES, PLAYGROUND_URL } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: connect account', () => {
  let connectAccountPage: Page;

  popup.beforeEach(async ({ page, context, unlockValutForSigning }) => {
    await page.goto(PLAYGROUND_URL);

    [connectAccountPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Connect', exact: true }).click()
    ]);

    await unlockValutForSigning(connectAccountPage);
  });

  popup(
    'should connect one account to playground',
    async ({ extensionId, page }) => {
      await popupExpect(
        connectAccountPage.getByText('Connect with Casper Wallet Playground')
      ).toBeVisible();

      await popupExpect(
        connectAccountPage.getByRole('button', { name: 'Next' })
      ).toBeDisabled();

      await connectAccountPage
        .getByText(ACCOUNT_NAMES.defaultFirstAccountName, { exact: true })
        .click();

      await popupExpect(
        connectAccountPage.getByRole('button', { name: 'Next' })
      ).toBeEnabled();

      await connectAccountPage.getByRole('button', { name: 'Next' }).click();
      await connectAccountPage
        .getByRole('button', { name: 'Connect to 1 account' })
        .click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await page.waitForLoadState('networkidle');

      await page.getByTestId('menu-open-icon').click();
      await page.getByText('Connected sites').click();

      await popupExpect(
        page.getByText('Casper Wallet Playground')
      ).toBeVisible();
      await popupExpect(
        page.getByText('cspr-wallet-playground.dev.make.services')
      ).toBeVisible();
      await popupExpect(
        page.getByRole('button', { name: 'Disconnect' })
      ).toBeVisible();
      await popupExpect(
        page
          .getByText(ACCOUNT_NAMES.defaultFirstAccountName, { exact: true })
          .nth(1)
      ).toBeVisible();
    }
  );

  popup(
    'should connect two accounts to playground',
    async ({ extensionId, page }) => {
      await popupExpect(
        connectAccountPage.getByText('Connect with Casper Wallet Playground')
      ).toBeVisible();

      await popupExpect(
        connectAccountPage.getByRole('button', { name: 'Next' })
      ).toBeDisabled();

      await connectAccountPage.getByText('select all', { exact: true }).click();

      await popupExpect(
        connectAccountPage.getByRole('button', { name: 'Next' })
      ).toBeEnabled();

      await connectAccountPage.getByRole('button', { name: 'Next' }).click();
      await connectAccountPage
        .getByRole('button', { name: 'Connect to 2 accounts' })
        .click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await page.getByTestId('menu-open-icon').click();
      await page.getByText('Connected sites').click();

      await popupExpect(
        page.getByText('Casper Wallet Playground')
      ).toBeVisible();
      await popupExpect(
        page.getByText('cspr-wallet-playground.dev.make.services')
      ).toBeVisible();
      await popupExpect(
        page.getByRole('button', { name: 'Disconnect' })
      ).toBeVisible();
      await popupExpect(
        page
          .getByText(ACCOUNT_NAMES.defaultFirstAccountName, { exact: true })
          .nth(1)
      ).toBeVisible();
      await popupExpect(
        page.getByText(ACCOUNT_NAMES.defaultSecondAccountName)
      ).toBeVisible();
    }
  );
});
