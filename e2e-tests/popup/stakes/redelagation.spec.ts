import {
  NEW_VALIDATOR_FOR_STAKE,
  RPC_RESPONSE,
  URLS,
  VALIDATOR_FOR_STAKE
} from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: Redelegation', () => {
  popup(
    'should made a successful redelegation',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.route(URLS.rpc, route =>
        route.fulfill(RPC_RESPONSE.success)
      );

      await popupPage.getByText('More').click();

      await popupPage.getByText('Redelegate', { exact: true }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Redelegate' })
      ).toBeVisible();

      await new Promise(r => setTimeout(r, 2000));

      await popupPage
        .getByPlaceholder('Validator public address', { exact: true })
        .fill(VALIDATOR_FOR_STAKE.publicKey);

      await new Promise(r => setTimeout(r, 2000));
      await popupPage
        .getByText(VALIDATOR_FOR_STAKE.truncatedPublicKey, { exact: true })
        .click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Redelegate amount' })
      ).toBeVisible();

      await popupPage.getByPlaceholder('0.00', { exact: true }).fill('500');

      await popupExpect(
        popupPage.getByRole('button', { name: 'Next' })
      ).not.toBeDisabled();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupPage.getByText('Delegate', { exact: true }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Delegate' })
      ).toBeVisible();

      await popupPage
        .getByPlaceholder('Validator public address', { exact: true })
        .fill(NEW_VALIDATOR_FOR_STAKE.publicKey);

      await new Promise(r => setTimeout(r, 2000));

      await popupPage
        .getByText(NEW_VALIDATOR_FOR_STAKE.truncatedPublicKey, { exact: true })
        .click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm redelegation' })
      ).toBeDisabled();

      await popupExpect(
        popupPage.getByText(VALIDATOR_FOR_STAKE.publicKey)
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(NEW_VALIDATOR_FOR_STAKE.publicKey)
      ).toBeVisible();

      // Scroll to the bottom
      await popupPage.evaluate(() => {
        const container = document.querySelector('#ms-container');

        container?.scrollTo(0, 1000);
      });

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm redelegation' })
      ).not.toBeDisabled();

      await popupPage
        .getByRole('button', { name: 'Confirm redelegation' })
        .click();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'You’ve submitted a redelegation'
        })
      ).toBeVisible();
    }
  );
});
