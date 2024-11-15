import { ActionType, createAction } from 'typesafe-actions';

export const bringWeb3Events = {
  getActivePublicKey: createAction('GET_ACTIVE_PUBLIC_KEY')(),
  getActivePublicKeyResponse: createAction('GET_ACTIVE_PUBLIC_KEY_RESPONSE')<{
    publicKey: string;
  }>(),
  promptLoginRequest: createAction('PROMPT_LOGIN_REQUEST')(),
  getTheme: createAction('GET_THEME')(),
  getThemeResponse: createAction('GET_THEME_RESPONSE')<{
    theme: 'light' | 'dark';
  }>()
};

export type BringWeb3Events = ActionType<typeof bringWeb3Events>;
