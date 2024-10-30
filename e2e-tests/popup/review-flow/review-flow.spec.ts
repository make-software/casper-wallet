import { expect } from '@playwright/test';

import { DEFAULT_SECOND_ACCOUNT, RPC_RESPONSE, URLS } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI:  review flow', () => {
  popup(
    'Positive review flow - go to web store',
    async ({ popupPage, unlockVault, context, page }) => {
      await unlockVault();

      await popupPage.route(URLS.rpc, route =>
        route.fulfill(RPC_RESPONSE.success)
      );
      await popupPage.waitForLoadState('networkidle');
      await new Promise(r => setTimeout(r, 5000));

      await popupPage.getByText('Send').click();
      await popupPage.waitForLoadState('networkidle');
      await popupExpect(
        popupPage.getByRole('heading', { name: 'Select token and account' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Specify recipient' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Next' })
      ).toBeDisabled();

      await popupPage
        .getByPlaceholder('Public key or name', { exact: true })
        .fill(DEFAULT_SECOND_ACCOUNT.publicKey);

      await popupExpect(
        popupPage.getByText(DEFAULT_SECOND_ACCOUNT.mediumTruncatedPublicKey, {
          exact: true
        })
      ).toBeVisible();

      await popupPage
        .getByText(DEFAULT_SECOND_ACCOUNT.mediumTruncatedPublicKey, {
          exact: true
        })
        .click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Enter amount' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Confirm sending' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(DEFAULT_SECOND_ACCOUNT.publicKey)
      ).toBeVisible();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm send' })
      ).toBeDisabled();

      // Scroll to the bottom
      await popupPage.evaluate(() => {
        const container = document.querySelector('#ms-container');

        container?.scrollTo(0, 1000);
      });

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm send' })
      ).not.toBeDisabled();

      await popupPage.getByRole('button', { name: 'Confirm send' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'You submitted a transaction' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Done' }).click();

      popupExpect(
        popupPage.getByRole('heading', {
          name: 'Are you enjoying Casper Wallet so far?'
        })
      ).toBeVisible();

      await popupPage
        .getByRole('button', { name: "Yes, I'm enjoying it" })
        .click();

      popupExpect(
        popupPage.getByRole('heading', { name: 'Thanks! You made our day' })
      ).toBeVisible();

      popupExpect(
        popupPage.getByRole('button', { name: 'Leave a review' })
      ).toBeVisible();

      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.getByRole('button', { name: 'Leave a review' }).click()
      ]);

      expect(newPage.url()).toBe(
        'https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp/reviews'
      );
    }
  );
  popup(
    'negative review flow - go to telegram',
    async ({ popupPage, unlockVault, context, page }) => {
      await unlockVault();

      await popupPage.route(URLS.rpc, route =>
        route.fulfill(RPC_RESPONSE.success)
      );

      await new Promise(r => setTimeout(r, 5000));

      await popupPage.getByText('Send').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Select token and account' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Specify recipient' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Next' })
      ).toBeDisabled();

      await popupPage
        .getByPlaceholder('Public key or name', { exact: true })
        .fill(DEFAULT_SECOND_ACCOUNT.publicKey);

      await popupExpect(
        popupPage.getByText(DEFAULT_SECOND_ACCOUNT.mediumTruncatedPublicKey, {
          exact: true
        })
      ).toBeVisible();

      await popupPage
        .getByText(DEFAULT_SECOND_ACCOUNT.mediumTruncatedPublicKey, {
          exact: true
        })
        .click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Enter amount' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Confirm sending' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(DEFAULT_SECOND_ACCOUNT.publicKey)
      ).toBeVisible();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm send' })
      ).toBeDisabled();

      await popupPage.evaluate(() => {
        const container = document.querySelector('#ms-container');

        container?.scrollTo(0, 1000);
      });

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm send' })
      ).not.toBeDisabled();

      await popupPage.getByRole('button', { name: 'Confirm send' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'You submitted a transaction' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Done' }).click();

      popupExpect(
        popupPage.getByRole('heading', {
          name: 'Are you enjoying Casper Wallet so far?'
        })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Not so much' }).click();

      popupExpect(
        popupPage.getByRole('heading', {
          name: "We'd love to hear more from you"
        })
      ).toBeVisible();

      popupExpect(
        popupPage.getByRole('button', { name: 'Get in touch' })
      ).toBeVisible();

      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.getByRole('button', { name: 'Get in touch' }).click()
      ]);

      expect(newPage.url()).toBe('https://t.me/CSPRhub/4689');
    }
  );

  popup(
    'negative review flow - go to home page',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.route(URLS.rpc, route =>
        route.fulfill(RPC_RESPONSE.success)
      );

      await new Promise(r => setTimeout(r, 5000));

      await popupPage.getByText('Send').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Select token and account' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Specify recipient' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Next' })
      ).toBeDisabled();

      await popupPage
        .getByPlaceholder('Public key or name', { exact: true })
        .fill(DEFAULT_SECOND_ACCOUNT.publicKey);

      await popupExpect(
        popupPage.getByText(DEFAULT_SECOND_ACCOUNT.mediumTruncatedPublicKey, {
          exact: true
        })
      ).toBeVisible();

      await popupPage
        .getByText(DEFAULT_SECOND_ACCOUNT.mediumTruncatedPublicKey, {
          exact: true
        })
        .click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Enter amount' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Confirm sending' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(DEFAULT_SECOND_ACCOUNT.publicKey)
      ).toBeVisible();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm send' })
      ).toBeDisabled();

      // Scroll to the bottom
      await popupPage.evaluate(() => {
        const container = document.querySelector('#ms-container');

        container?.scrollTo(0, 1000);
      });

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm send' })
      ).not.toBeDisabled();

      await popupPage.getByRole('button', { name: 'Confirm send' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'You submitted a transaction' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Done' }).click();

      popupExpect(
        popupPage.getByRole('heading', {
          name: 'Are you enjoying Casper Wallet so far?'
        })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Not so much' }).click();

      popupExpect(
        popupPage.getByRole('heading', {
          name: "We'd love to hear more from you"
        })
      ).toBeVisible();

      popupExpect(
        popupPage.getByRole('button', { name: 'Maybe later' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Maybe later' }).click();

      popupExpect(popupPage.getByText('Total balance')).toBeVisible();
      popupExpect(popupPage.getByText('Delegated')).toBeVisible();
    }
  );
});
