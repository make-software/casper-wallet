import { RootState } from 'typesafe-actions';

export const selectAllContacts = (state: RootState) => state.contacts.contacts;

export const selectCountOfContacts = (state: RootState) =>
  state.contacts.contacts.length;

export const selectAllContactsNames = (state: RootState) =>
  state.contacts.contacts.map(contact => contact.name);

export const selectAllContactsPublicKeys = (state: RootState) =>
  state.contacts.contacts.map(contact => contact.publicKey);

export const selectLastModified = (state: RootState) =>
  state.contacts.lastModified;
