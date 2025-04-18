import { RPC_RESPONSE, URLS, VALIDATOR_FOR_UNDELEGATE } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: Undelegation', () => {
  popup(
    'should made a successful undelegation',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.route(URLS.rpc, route =>
        route.fulfill(RPC_RESPONSE.success)
      );

      await popupPage.getByText('More').click();

      await popupPage.getByText('Undelegate', { exact: true }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Undelegate' })
      ).toBeVisible();

      await new Promise(r => setTimeout(r, 2000));

      await popupPage
        .getByText(VALIDATOR_FOR_UNDELEGATE.truncatedPublicKey, { exact: true })
        .click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Undelegate amount' })
      ).toBeVisible();

      await popupPage.getByPlaceholder('0.00', { exact: true }).fill('500');

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByText(VALIDATOR_FOR_UNDELEGATE.publicKey)
      ).toBeVisible();

      // Scroll to the bottom
      await popupPage.evaluate(() => {
        const container = document.querySelector('#ms-container');

        container?.scrollTo(0, 1000);
      });

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm undelegation' })
      ).not.toBeDisabled();

      await popupPage
        .getByRole('button', { name: 'Confirm undelegation' })
        .click();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'You’ve submitted an undelegation'
        })
      ).toBeVisible();
    }
  );
});
