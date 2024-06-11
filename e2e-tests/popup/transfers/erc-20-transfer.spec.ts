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
              api_version: '1.5.6',
              deploy_hash: 'deploy hash'
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
        .getByPlaceholder('Public key', { exact: true })
        .fill(DEFAULT_SECOND_ACCOUNT.publicKey);

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
      .getByPlaceholder('Public key', { exact: true })
      .fill(DEFAULT_SECOND_ACCOUNT.publicKey);

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
    ).not.toBeDisabled();

    await popupPage.getByRole('button', { name: 'Confirm send' }).click();

    await popupExpect(
      popupPage.getByRole('heading', { name: 'Error message' })
    ).toBeVisible();
    await popupExpect(popupPage.getByText('Error description')).toBeVisible();

    await popupPage.getByRole('button', { name: 'Close' }).click();
  });
});
