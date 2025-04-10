import { DEFAULT_SECOND_ACCOUNT, RPC_RESPONSE, URLS } from '../../constants';
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
        name: 'failed to send http request, details: Code: 500, err: Internal Server Error'
      })
    ).toBeVisible();
    await popupExpect(
      popupPage.getByText(
        'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
      )
    ).toBeVisible();

    await popupPage.getByRole('button', { name: 'Close' }).click();
  });
});
