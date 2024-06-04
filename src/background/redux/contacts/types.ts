export interface Contact {
  name: string;
  publicKey: string;
  lastModified: string;
}

export type ContactsState = {
  contacts: Contact[];
  lastModified: string | null;
};

export interface EditContactActionType extends Contact {
  oldName: string;
}

export interface ContactWithId extends Contact {
  id: string;
}
