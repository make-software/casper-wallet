import { DEFAULT_SECOND_ACCOUNT } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: ERC-20 transfer', () => {
  popup(
    'should made a successful transfer',
    async ({ unlockVault, popupPage }) => {
      await unlockVault();

      await popupPage.route('https://node.testnet.cspr.cloud/rpc', route =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1717761373590,
            result: {
              api_version: '2.0.0',
              transaction_hash: {
                Version1:
                  '9de32b7f6d79e559cb3f7b94250a605739de803d98ec681cc4a4b7dc8604fdae'
              }
            }
          })
        })
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

    await popupPage.route('https://node.testnet.cspr.cloud/rpc', route =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1717761373590,
          error: {
            code: '',
            data: 'Error description',
            message: 'Error message'
          }
        })
      })
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
      popupPage.getByText(
        'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
      )
    ).toBeVisible();

    await popupPage.getByRole('button', { name: 'Close' }).click();
  });
});
