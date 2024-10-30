import { ACCOUNT_NAMES, accountSettingLocator } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: create account', () => {
  popup.beforeEach(async ({ unlockVault, popupPage }) => {
    await unlockVault(popupPage);
  });

  popup(
    'should hide account from menu',
    async ({ popupPage, createAccount }) => {
      await createAccount(ACCOUNT_NAMES.createdAccountName);

      await popupExpect(
        popupPage.getByText(ACCOUNT_NAMES.createdAccountName)
      ).toBeVisible();

      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('All accounts').click();
      await popupExpect(popupPage.locator('canvas').nth(2)).toBeVisible;
      await popupPage.waitForLoadState('networkidle');

      await popupExpect(
        popupPage.locator(accountSettingLocator('Account 1'))
      ).toBeVisible();

      await popupPage.locator(accountSettingLocator('Account 1')).click();

      await popupPage.getByText('Hide from list').waitFor({ state: 'visible' });
      await popupPage.getByText('Hide from list').click();

      await popupPage.locator(accountSettingLocator('Account 2')).click();

      await popupPage.getByText('Hide from list').click();

      await popupPage
        .locator(accountSettingLocator('First New Account'))
        .click();

      await popupPage.getByText('Hide from list').click();

      await popupPage.waitForLoadState('domcontentloaded');

      await popupPage.getByTestId('connection-status-modal').click();
      await popupPage.getByText('Back').click();
      await popupExpect(popupPage.getByText('First New Account')).toBeVisible();
      await popupPage.getByTestId('connection-status-modal').click();

      await popupExpect(
        popupPage
          .locator('.sc-laZRCg > div')
          .first()
          .getByText('First New Account')
      ).toBeVisible();

      await popupExpect(popupPage.getByText('Account 2')).toBeHidden({
        timeout: 5000
      });

      await popupExpect(popupPage.getByText('Account 1')).toBeHidden({
        timeout: 5000
      });
    }
  );
  popup('should hide account from manage page', async ({ popupPage }) => {
    await popupPage.getByTestId('connection-status-modal').click();
    await popupPage.getByTestId('popover-children-container').nth(0).click();

    await popupPage.getByText('Manage').click();

    await popupExpect(popupPage.getByText('Public key')).toBeVisible();
    await popupExpect(
      popupPage.getByRole('banner').getByText('Account 1')
    ).toBeVisible();

    await popupPage
      .locator('div')
      .filter({ hasText: /^Close$/ })
      .getByRole('img')
      .nth(1)
      .click();
    await popupExpect(
      popupPage.getByRole('banner').getByText('Account 1')
    ).toBeHidden();

    await popupPage.getByText('Close').click();
    await popupPage
      .getByTestId('connection-status-modal')
      .locator('canvas')
      .click();
    await popupExpect(
      popupPage.getByRole('banner').getByText('Account 1')
    ).toBeHidden();
  });
});
