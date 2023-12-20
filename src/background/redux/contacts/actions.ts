import { createAction } from 'typesafe-actions';

import {
  Contact,
  EditContactActionType
} from '@background/redux/contacts/types';

export const newContactAdded = createAction('NEW_CONTACT_ADDED')<Contact>();

export const contactRemoved = createAction('CONTACT_REMOVED')<string>();

export const contactUpdated =
  createAction('CONTACT_UPDATED')<EditContactActionType>();

export const contactsReseted = createAction('CONTACTS_RESETED')();
