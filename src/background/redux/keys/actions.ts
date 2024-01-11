import { createAction } from 'typesafe-actions';

import { KeysState } from './types';

export const keysUpdated = createAction('KEYS_UPDATED')<Partial<KeysState>>();

export const keysReseted = createAction('KEYS_RESETED')<void>();
