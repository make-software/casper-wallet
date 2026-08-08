import {
  ACCOUNT_NAMES,
  DEFAULT_SECOND_ACCOUNT,
  RPC_RESPONSE,
  URLS
} from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: Casper Native Transfer', () => {
  popup(
    'should made a successful transfer',
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

      // `askForReviewAfter` is null on fresh mock state, so Done routes to
      // RateApp. Every exit from RateApp is a post-submission exit, so the
      // Activity override has to survive it. `getByTitle` observes activeness:
      // only `ActiveTabContainer` carries the attribute.
      await popupPage.getByText('Close').click();

      await popupExpect(popupPage.getByTitle('Activity')).toBeVisible();
    }
  );

  popup('should made a failed transfer', async ({ popupPage, unlockVault }) => {
    await unlockVault();

    await popupPage.route(URLS.rpc, route =>
      route.fulfill(RPC_RESPONSE.failure)
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
      popupPage.getByRole('heading', {
        name: 'Internal Server Error'
      })
    ).toBeVisible();
    await popupExpect(
      popupPage.getByText('Please check the browser')
    ).toBeVisible();

    await popupPage.getByRole('button', { name: 'Close' }).click();
  });

  popup(
    'should switch the recipient tabs',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await new Promise(r => setTimeout(r, 5000));

      await popupPage.getByText('Send').click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Specify recipient' })
      ).toBeVisible();

      // The strip only renders while the input is empty — typing a valid key
      // swaps it for `SearchItemByPublicKey`. This is the tree's only
      // uncontrolled `<Tabs>`, so it is the only thing exercising the
      // `activeTabName === undefined` branch of `handleTabClick`.
      await popupExpect(popupPage.getByTitle('Recent')).toBeVisible();

      await popupPage.getByText('My accounts').click();

      await popupExpect(popupPage.getByTitle('My accounts')).toBeVisible();
      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.defaultSecondAccountName, {
          exact: true
        })
      ).toBeVisible();

      await popupPage.getByText('Recent').click();

      await popupExpect(popupPage.getByTitle('Recent')).toBeVisible();
    }
  );
});
