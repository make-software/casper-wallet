import { popup, popupExpect } from '../../fixtures';
import { ACCOUNT_NAMES, PLAYGROUND_URL } from '../../constants';

popup.describe('Popup UI: disconnect account', () => {
  popup.beforeEach(async ({ connectAccounts }) => {
    await connectAccounts();
  });

  popup(
    'should click the disconnect button on dapp and disconnect all accounts from the site',
    async ({ page, extensionId }) => {
      await page.goto(PLAYGROUND_URL);

      await page.getByRole('button', { name: 'Disconnect' }).click();

      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await page.getByTestId('menu-open-icon').click();
      await page.getByText('Connected sites').click();

      await popupExpect(page.getByText('No connected sites yet')).toBeVisible();
    }
  );

  popup(
    'should click the disconnect button on connecting site page and disconnect one account from the site',
    async ({ popupPage }) => {
      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Connected sites').click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.defaultFirstAccountName)
      ).toBeVisible();
      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.defaultSecondAccountName)
      ).toBeVisible();

      const disconnectIcons = await popupPage
        .getByTestId('disconnect-account-icon')
        .all();
      await disconnectIcons[0].click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.defaultFirstAccountName)
      ).not.toBeVisible();
      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.defaultSecondAccountName)
      ).toBeVisible();
    }
  );

  popup(
    'should click the disconnect button on connecting site page and disconnect all accounts from the site',
    async ({ popupPage }) => {
      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Connected sites').click();

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.defaultFirstAccountName)
      ).toBeVisible();
      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.defaultSecondAccountName)
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Disconnect' }).click();

      await popupExpect(
        popupPage.getByText('No connected sites yet')
      ).toBeVisible();
    }
  );
});
