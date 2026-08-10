import { createAction } from '@reduxjs/toolkit';

export const bringWeb3Events = {
  getActivePublicKey: createAction('GET_ACTIVE_PUBLIC_KEY'),
  getActivePublicKeyResponse: createAction<{ publicKey: string | null }>(
    'GET_ACTIVE_PUBLIC_KEY_RESPONSE'
  ),
  promptLoginRequest: createAction('PROMPT_LOGIN_REQUEST'),
  getTheme: createAction('GET_THEME'),
  getThemeResponse: createAction<{ theme: 'light' | 'dark' }>(
    'GET_THEME_RESPONSE'
  )
};
