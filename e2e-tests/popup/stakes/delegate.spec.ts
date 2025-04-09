import { RPC_RESPONSE, URLS, VALIDATOR_FOR_STAKE } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: Delegation', () => {
  popup(
    'should made a successful delegation',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.route(URLS.rpc, route =>
        route.fulfill(RPC_RESPONSE.success)
      );

      await popupPage.getByText('More').click();

      await popupPage.getByText('Delegate', { exact: true }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Delegate' })
      ).toBeVisible();

      await popupPage
        .getByPlaceholder('Validator public address', { exact: true })
        .fill(VALIDATOR_FOR_STAKE.publicKey);

      await new Promise(r => setTimeout(r, 2000));

      await popupPage
        .getByText(VALIDATOR_FOR_STAKE.truncatedPublicKey, { exact: true })
        .click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Delegate amount' })
      ).toBeVisible();

      await popupPage.getByPlaceholder('0.00', { exact: true }).fill('500');

      await popupPage.getByRole('button', { name: 'Next' }).click();

      // Scroll to the bottom
      await popupPage.evaluate(() => {
        const container = document.querySelector('#ms-container');

        container?.scrollTo(0, 1000);
      });

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm delegation' })
      ).not.toBeDisabled();

      await popupPage
        .getByRole('button', { name: 'Confirm delegation' })
        .click();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'You’ve submitted a delegation'
        })
      ).toBeVisible();

      await popupPage.waitForTimeout(1000);
      await popupPage.getByRole('button', { name: 'Done' }).click();

      await popupPage.getByText('Close').click();
    }
  );
});
