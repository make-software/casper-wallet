import { expect } from '@playwright/test';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI:  review flow', () => {
  popup(
    'should redirect to web store',
    async ({ popupPage, unlockVault, context, page, sendCsprTokens }) => {
      await unlockVault();

      await sendCsprTokens();
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
    'should redirect to telegram',
    async ({ popupPage, unlockVault, context, page, sendCsprTokens }) => {
      await unlockVault();

      await sendCsprTokens();

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
    'should redirect to home page',
    async ({ popupPage, unlockVault, sendCsprTokens }) => {
      await unlockVault();

      await sendCsprTokens();

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
