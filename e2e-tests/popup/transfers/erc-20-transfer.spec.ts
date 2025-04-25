
import { DEFAULT_SECOND_ACCOUNT, RPC_RESPONSE, URLS } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: ERC-20 transfer', () => {
  popup(
    'should made a successful transfer',
    async ({ unlockVault, popupPage }) => {
      await unlockVault();

      await popupPage.route(URLS.rpc, route =>
        route.fulfill(RPC_RESPONSE.success)
      );

      await new Promise(r => setTimeout(r, 5000));

      await popupPage.getByText('Send').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Select token and account' })
      ).toBeVisible();

      await popupPage.getByTestId('token-row').click();

      await popupPage.getByText('CSPR.click tests').click();

      // wait until a modal window closed
      await new Promise(r => setTimeout(r, 2000));

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

      await popupPage.getByPlaceholder('0.00', { exact: true }).fill('10');

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

  popup('should made a failed transfer', async ({ unlockVault, popupPage }) => {
    await unlockVault();

    await popupPage.route(URLS.rpc, route =>
      route.fulfill(RPC_RESPONSE.failure)
    );

    await new Promise(r => setTimeout(r, 5000));

    await popupPage.getByText('Send').click();

    await popupExpect(
      popupPage.getByRole('heading', { name: 'Select token and account' })
    ).toBeVisible();

    await popupPage.getByTestId('token-row').click();

    await popupPage.getByText('CSPR.click tests').click();

    // wait until a modal window closed
    await new Promise(r => setTimeout(r, 2000));

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

    await popupPage.getByPlaceholder('0.00', { exact: true }).fill('10');

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
      popupPage.getByText('Please check the browser')
    ).toBeVisible();

    await popupPage.getByRole('button', { name: 'Close' }).click();
  });
});
