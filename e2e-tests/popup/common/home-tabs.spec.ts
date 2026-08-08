import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: Home tabs', () => {
  popup(
    'should stay on the Tokens tab after coming back from token details',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();
      await new Promise(r => setTimeout(r, 2000));

      // Reach Home the way that used to stamp the stale tab index onto the
      // history entry: open an NFT and come back.
      await popupPage.getByText('NFTs').click();
      await new Promise(r => setTimeout(r, 2000));

      await popupPage
        .getByTestId('nft-token-card')
        .filter({ hasText: 'west' })
        .click();
      await popupExpect(
        popupPage.getByRole('heading', { name: 'west' })
      ).toBeVisible();

      await popupPage.getByText('Back').click();
      await popupExpect(popupPage.getByTitle('NFTs')).toBeVisible();

      // Switch to Tokens, open a token, come back.
      await popupPage.getByText('Tokens').click();
      await popupExpect(popupPage.getByTitle('Tokens')).toBeVisible();

      await popupPage.getByText('Casper', { exact: true }).first().click();
      await popupExpect(
        popupPage.getByRole('heading', { name: 'Token' })
      ).toBeVisible();

      await popupPage.getByText('Back').click();

      await popupExpect(popupPage.getByTitle('Tokens')).toBeVisible();
    }
  );

  popup(
    'should stay on the Activity tab after coming back from deploy details',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();
      await new Promise(r => setTimeout(r, 2000));

      await popupPage.getByText('Activity').click();
      await new Promise(r => setTimeout(r, 2000));

      await popupPage.getByTestId('deploy-plate').first().click();
      await popupPage.getByText('Back').click();

      await popupExpect(popupPage.getByTitle('Activity')).toBeVisible();

      await popupPage.getByText('Tokens').click();
      await popupPage.getByText('Casper', { exact: true }).first().click();
      await popupExpect(
        popupPage.getByRole('heading', { name: 'Token' })
      ).toBeVisible();

      await popupPage.getByText('Back').click();

      await popupExpect(popupPage.getByTitle('Tokens')).toBeVisible();
    }
  );

  popup(
    'should keep the active tab when the navigation menu is opened and closed',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();
      await new Promise(r => setTimeout(r, 2000));

      await popupPage.getByText('NFTs').click();
      await popupExpect(popupPage.getByTitle('NFTs')).toBeVisible();

      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByTestId('menu-close-icon').click();

      await popupExpect(popupPage.getByTitle('NFTs')).toBeVisible();
    }
  );

  popup(
    'should keep deploy details rendered when the navigation menu is toggled',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();
      await new Promise(r => setTimeout(r, 2000));

      await popupPage.getByText('Activity').click();
      await new Promise(r => setTimeout(r, 2000));

      await popupPage.getByTestId('deploy-plate').first().click();
      await popupExpect(
        popupPage.getByText('Timestamp', { exact: true })
      ).toBeVisible();

      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByTestId('menu-close-icon').click();

      await popupExpect(
        popupPage.getByText('Timestamp', { exact: true })
      ).toBeVisible();
    }
  );

  popup(
    'should reset to the Tokens tab after the vault is locked',
    async ({ popupPage, unlockVault, lockVault }) => {
      await unlockVault();

      // Home opens on Tokens. Waiting for that rather than sleeping a fixed
      // 2s keeps a slow unlock from surfacing as an opaque timeout on the
      // tab click below.
      await popupExpect(popupPage.getByTitle('Tokens')).toBeVisible();

      await popupPage.getByText('NFTs').click();
      await popupExpect(popupPage.getByTitle('NFTs')).toBeVisible();

      // The tab is a plain `useState` with no persistence and no reset of its
      // own — its ephemerality rests entirely on `HomeTabProvider` sitting
      // below the `isLocked` gate in `app-router.tsx`, so the subtree unmounts.
      await lockVault();
      await unlockVault();

      // `lockVault` goes through the burger menu, and `showNavigationMenu`
      // outlives the lock in `location.state` — so unlocking lands back in the
      // menu rather than on Home. Closing it is what the user does next.
      await popupPage.getByTestId('menu-close-icon').click();

      await popupExpect(popupPage.getByTitle('Tokens')).toBeVisible();
    }
  );
});
