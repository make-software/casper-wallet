import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
  Contact,
  ContactsState,
  EditContactActionType
} from '@background/redux/contacts/types';

const initialState = { contacts: [], lastModified: null } as ContactsState;

const slice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    contactsReseted: () => initialState,
    newContactAdded: (state, action: PayloadAction<Contact>) => {
      const sortedContacts = [...state.contacts, action.payload].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      return {
        contacts: sortedContacts,
        lastModified: action.payload.lastModified
      };
    },
    contactRemoved: (state, action: PayloadAction<string>) => ({
      contacts: state.contacts.filter(
        contact => contact.name !== action.payload
      ),
      lastModified: new Date().toISOString()
    }),
    contactUpdated: (
      state,
      { payload }: PayloadAction<EditContactActionType>
    ) => {
      const newContacts = {
        name: payload.name,
        publicKey: payload.publicKey,
        lastModified: payload.lastModified
      };
      return {
        contacts: state.contacts.map(contact =>
          contact.name === payload.oldName ? newContacts : contact
        ),
        lastModified: payload.lastModified
      };
    }
  }
});

export const {
  contactRemoved,
  contactUpdated,
  contactsReseted,
  newContactAdded
} = slice.actions;
export const reducer = slice.reducer;
