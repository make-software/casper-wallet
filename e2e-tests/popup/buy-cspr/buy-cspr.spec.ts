import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: buy cspr', () => {
  popup(
    'should redirect to Topper provider page',
    async ({ popupPage, unlockVault, context }) => {
      await unlockVault();

      await popupPage.getByTestId('network-switcher').click();
      await popupPage.getByText('Mainnet').click();

      await popupPage.getByText('Buy').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Pick country' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Enter amount' })
      ).toBeVisible();
      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Pick provider' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm' })
      ).toBeDisabled();

      await popupPage.getByText('Topper by Uphold').click();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm' })
      ).not.toBeDisabled();

      const [torusPage] = await Promise.all([
        context.waitForEvent('page'),
        popupPage.getByRole('button', { name: 'Confirm' }).click()
      ]);

      await new Promise(r => setTimeout(r, 2000));

      popupExpect(torusPage.url()).toContain('https://app.topperpay.com/');
    }
  );

  popup(
    'should redirect to Ramp provider page',
    async ({ popupPage, unlockVault, context }) => {
      await unlockVault();

      await popupPage.getByTestId('network-switcher').click();
      await popupPage.getByText('Mainnet').click();

      await popupPage.getByText('Buy').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Pick country' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Enter amount' })
      ).toBeVisible();
      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Pick provider' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm' })
      ).toBeDisabled();

      await popupPage.getByText('Ramp').click();

      await popupExpect(
        popupPage.getByRole('button', { name: 'Confirm' })
      ).not.toBeDisabled();

      const [rampPage] = await Promise.all([
        context.waitForEvent('page'),
        popupPage.getByRole('button', { name: 'Confirm' }).click()
      ]);

      await new Promise(r => setTimeout(r, 2000));

      popupExpect(rampPage.url()).toContain('https://app.ramp.network/');
    }
  );

  popup(
    'should display and empty provider page when no available provider',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.getByTestId('network-switcher').click();
      await popupPage.getByText('Mainnet').click();

      await popupPage.getByText('Buy').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Pick country' })
      ).toBeVisible();

      await popupPage.getByTestId('country-row').click();

      await popupPage
        .getByPlaceholder('Search', { exact: true })
        .fill('Ukraine');

      await popupPage.getByText('Ukraine').click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Enter amount' })
      ).toBeVisible();
      await popupPage.getByTestId('currency-row').click();

      await popupPage.getByPlaceholder('Search', { exact: true }).fill('UAH');

      await popupPage.getByText('UAH').click();

      await popupPage.getByRole('button', { name: 'Next' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'No available provider' })
      ).toBeVisible();
    }
  );
});
