import {
    DEFAULT_FIRST_ACCOUNT,
    DEFAULT_SECOND_ACCOUNT,
    vaultPassword
  } from '../../constants';
  import { popup, popupExpect } from '../../fixtures';
 
 
  //TODO
  // add check to comparedisplayed phrase with the one used in onboarding
   popup.describe('Popup UI: back up secret phrase', () => {
    popup(
      "should display a secret phrase after providing password and copy phrase",
      async ({ popupPage, unlockVault, providePassword }) => {
        await unlockVault();
         await popupPage.getByTestId('menu-open-icon').click();
        await popupPage.getByText('Back up your secret recovery phrase').click();
         await providePassword();
 
 
        await popupExpect(
          popupPage.getByRole('heading', { name: 'Back up your secret recovery phrase' })
        ).toBeVisible();
         await popupPage.getByText('Click to reveal secret recovery phrase').click();
        await popupPage.getByText('Copy secret recovery phrase').click();
       
 
 
        await popupExpect(
            popupPage.getByText(
              'Copied to clipboard'
            )
          ).toBeVisible();
      }
   
    );
     popup(
      'should display safety tips',
      async ({ popupPage, unlockVault, providePassword }) => {
        await unlockVault();
         await popupPage.getByTestId('menu-open-icon').click();
        await popupPage.getByText('Back up your secret recovery phrase').click();
         await providePassword();
 
 
        await popupExpect(
          popupPage.getByRole('heading', { name: 'Back up your secret recovery phrase' })
        ).toBeVisible();    
 
 
        await popupExpect(
            popupPage.getByText(
              'Save a backup in multiple secure locations.'
            )
          ).toBeVisible();
 
 
        await popupExpect(
          popupPage.getByText(
            'Never share the phrase with anyone.'
          )
        ).toBeVisible();
 
 
        await popupExpect(
          popupPage.getByText(
            'Be careful of phishing! Casper Wallet will never spontaneously ask you for your secret recovery phrase.'
          )
        ).toBeVisible();
 
 
        await popupExpect(
          popupPage.getByText(
            'If you need to back up your secret recovery phrase again, you can find it in Settings.'
          )
        ).toBeVisible();
 
 
        await popupExpect(
          popupPage.getByText(
            'Casper Wallet cannot recover your secret recovery phrase! If you lose it, you may not be able to recover your funds.'
          )
        ).toBeVisible();
      })
 
 
      popup(
        "should timeout after providing wrong password 5 times",
      async ({ popupPage, unlockVault, passwordTimeout }) => {
        await unlockVault();
       
        await popupPage.getByTestId('menu-open-icon').click();
        await popupPage.getByText('Back up your secret recovery phrase').click();
   
        await passwordTimeout();
 
 
        await popupExpect(
            popupPage.getByRole('heading', { name: 'Please wait before the next attempt to unlock your wallet' })
          ).toBeVisible();
        })
      });
  
     
   
 
 
 
 
 
 