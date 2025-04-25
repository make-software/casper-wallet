import { FIRST_CONTACT, SECOND_CONTACT, vaultPassword } from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: contacts', () => {
  popup(
    "should display an empty contacts list when no contacts are present in the user's contact book",
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Contacts').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'No contacts just yet' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(
          'You can add here a list of contacts to make it easier for you to send tokens.'
        )
      ).toBeVisible();
    }
  );

  popup(
    'should successfully add a contact and display it in the contacts list',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Contacts').click();

      await popupPage.getByRole('button', { name: 'Add contact' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'New contact' })
      ).toBeVisible();

      await popupPage
        .getByPlaceholder('Name', { exact: true })
        .fill(FIRST_CONTACT.accountName);
      await popupPage
        .getByPlaceholder('Public key', { exact: true })
        .fill(FIRST_CONTACT.publicKey);

      await popupPage.getByRole('button', { name: 'Add contact' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'All done!' })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(
          'You will see this contact’s details and select it when you transfer or delegate tokens.'
        )
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Done' }).click();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: 'Contacts'
        })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(FIRST_CONTACT.accountName, { exact: true })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(FIRST_CONTACT.mediumTruncatedPublicKey)
      ).toBeVisible();
    }
  );

  popup(
    'should display an error message for addition of a contact with an invalid public key',
    async ({ popupPage, unlockVault }) => {
      await unlockVault();

      await popupPage.getByTestId('menu-open-icon').click();
      await popupPage.getByText('Contacts').click();

      await popupPage.getByRole('button', { name: 'Add contact' }).click();

      await popupPage
        .getByPlaceholder('Name', { exact: true })
        .fill(FIRST_CONTACT.accountName);
      await popupPage
        .getByPlaceholder('Public key', { exact: true })
        .fill(FIRST_CONTACT.truncatedPublicKey);

      await popupExpect(
        popupPage.getByText('Public address should be a valid public key')
      ).toBeVisible();
      await popupExpect(
        popupPage.getByRole('button', { name: 'Add contact' })
      ).toBeDisabled();
    }
  );

  popup(
    'should show error message for duplicate contact name during contact addition',
    async ({ popupPage, unlockVault, addContact }) => {
      await unlockVault();
      await addContact();

      await popupPage.getByRole('button', { name: 'Add contact' }).click();

      await popupPage
        .getByPlaceholder('Name', { exact: true })
        .fill(FIRST_CONTACT.accountName);
      await popupPage
        .getByPlaceholder('Public key', { exact: true })
        .fill(FIRST_CONTACT.publicKey);

      await popupExpect(
        popupPage.getByText(
          'You’ve already got a contact with this name. Please find a new name for this one'
        )
      ).toBeVisible();
      await popupExpect(
        popupPage.getByRole('button', { name: 'Add contact' })
      ).toBeDisabled();
    }
  );

  popup(
    'should show contact details on contact selection',
    async ({ popupPage, unlockVault, addContact }) => {
      await unlockVault();
      await addContact();

      await popupPage
        .getByText(FIRST_CONTACT.accountName, { exact: true })
        .click();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: FIRST_CONTACT.accountName
        })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(FIRST_CONTACT.publicKey, { exact: true })
      ).toBeVisible();
    }
  );

  popup(
    'should edit a contact successfully and display the updated contact details',
    async ({ popupPage, unlockVault, addContact }) => {
      await unlockVault();
      await addContact();

      await popupPage
        .getByText(FIRST_CONTACT.accountName, { exact: true })
        .click();

      await popupPage.getByTestId('edit-contact-button').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Enter your password' })
      ).toBeVisible();

      await popupPage
        .getByPlaceholder('Password', { exact: true })
        .fill(vaultPassword);
      await popupPage.getByRole('button', { name: 'Continue' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Edit contact' })
      ).toBeVisible();
      popupExpect(
        await popupPage.getByPlaceholder('Name', { exact: true }).inputValue()
      ).toBe(FIRST_CONTACT.accountName);
      popupExpect(
        await popupPage
          .getByPlaceholder('Public key', { exact: true })
          .inputValue()
      ).toBe(FIRST_CONTACT.publicKey);

      await popupPage
        .getByPlaceholder('Name', { exact: true })
        .fill(SECOND_CONTACT.accountName);
      await popupPage
        .getByPlaceholder('Public key', { exact: true })
        .fill(SECOND_CONTACT.publicKey);

      await popupPage.getByRole('button', { name: 'Save' }).click();

      await popupExpect(
        popupPage.getByText(FIRST_CONTACT.accountName, { exact: true })
      ).not.toBeVisible();

      await popupPage.getByText(SECOND_CONTACT.accountName).click();

      await popupExpect(
        popupPage.getByRole('heading', {
          name: SECOND_CONTACT.accountName
        })
      ).toBeVisible();

      await popupExpect(
        popupPage.getByText(SECOND_CONTACT.publicKey)
      ).toBeVisible();
    }
  );

  popup(
    'should remove a contact successfully',
    async ({ popupPage, unlockVault, addContact }) => {
      await unlockVault();
      await addContact();

      await popupPage
        .getByText(FIRST_CONTACT.accountName, { exact: true })
        .click();

      await popupPage.getByTestId('delete-contact-button').click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Enter your password' })
      ).toBeVisible();

      await popupPage
        .getByPlaceholder('Password', { exact: true })
        .fill(vaultPassword);
      await popupPage.getByRole('button', { name: 'Continue' }).click();

      await popupExpect(
        popupPage.getByRole('heading', { name: 'Delete contact' })
      ).toBeVisible();

      await popupPage.getByRole('button', { name: 'Delete' }).click();

      await popupExpect(
        popupPage.getByText(FIRST_CONTACT.accountName, { exact: true })
      ).not.toBeVisible();
    }
  );
});
