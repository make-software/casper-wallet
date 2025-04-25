import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: change password', () => {
  popup(
    'should succesfully change password',
    async ({
      popupPage,
      unlockVault,
      providePassword,
      changePassword,
      provideNewPassword,
      lockVault,
      unlockVaultNewPassword
    }) => {
      await unlockVault();
      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Change Password').click();
      await providePassword();

      await popupExpect(popupPage.getByText('Change Password')).toBeVisible();

      await changePassword();

      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Back up your secret recovery phrase').click();
      await provideNewPassword();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'Back up your secret recovery phrase'
        })
      ).toBeVisible();
      await lockVault();
      await unlockVaultNewPassword();

      await popupExpect(
        popupPage.getByTestId('network-switcher').getByRole('img')
      ).toBeVisible();
    }
  );

  popup(
    'should validate if password match in each field',
    async ({
      popupPage,
      unlockVault,
      providePassword,
      provideNewPassword,
      lockVault,
      setWrongPassword
    }) => {
      await unlockVault();
      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Change Password').click();
      await providePassword();

      await popupExpect(popupPage.getByText('Change Password')).toBeVisible();

      await setWrongPassword();
      await popupExpect(
        popupPage.getByText("Passwords don't match")
      ).toBeVisible();

      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Back up your secret recovery phrase').click();
      await provideNewPassword();
      await popupExpect(
        popupPage.getByText(
          'Password is incorrect. You’ve got 4 attempts, after that you’ll have to wait for'
        )
      ).toBeVisible();
      await providePassword();
      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'Back up your secret recovery phrase'
        })
      ).toBeVisible();
      await lockVault();
      await unlockVault();

      await popupExpect(
        popupPage.getByTestId('network-switcher').getByRole('img')
      ).toBeVisible();
    }
  );
});
