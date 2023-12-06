import { createReducer } from 'typesafe-actions';

import {
  contactRemoved,
  contactUpdated,
  newContactAdded
} from '@background/redux/contacts/actions';
import { ContactsState } from '@background/redux/contacts/types';

const initialState = { contacts: [], lastModified: null } as ContactsState;

export const reducer = createReducer(initialState)
  .handleAction(newContactAdded, (state, action) => {
    const sortedContacts = [...state.contacts, action.payload].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return {
      contacts: sortedContacts,
      lastModified: action.payload.lastModified
    };
  })
  .handleAction(contactRemoved, (state, action) => {
    return {
      contacts: state.contacts.filter(
        contact => contact.name !== action.payload
      ),
      lastModified: new Date().toISOString()
    };
  })
  .handleAction(contactUpdated, (state, { payload }) => {
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
  });
