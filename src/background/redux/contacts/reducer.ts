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
    return {
      contacts: [...state.contacts, action.payload],
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
    return {
      contacts: state.contacts.map(contact =>
        contact.name === payload.oldName ? payload : contact
      ),
      lastModified: payload.lastModified
    };
  });
