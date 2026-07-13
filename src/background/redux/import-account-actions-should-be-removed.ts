import { runtime } from 'webextension-polyfill';

// WARNING: legacy to be refactored, don't reuse!

export type CheckAccountNameIsTakenAction = {
  type: 'check-account-name-is-taken';
  payload: { accountName: string };
};

export const checkAccountNameIsTaken = (value: string): Promise<boolean> => {
  const action: CheckAccountNameIsTakenAction = {
    type: 'check-account-name-is-taken',
    payload: {
      accountName: value
    }
  };
  return runtime.sendMessage(action);
};

export type CheckSecretKeyExistAction = {
  type: 'check-secret-key-exist';
  payload: { secretKeyBase64: string };
};
export const checkSecretKeyExist = (
  secretKeyBase64: string
): Promise<boolean> => {
  const action: CheckSecretKeyExistAction = {
    type: 'check-secret-key-exist',
    payload: {
      secretKeyBase64
    }
  };
  return runtime.sendMessage(action);
};
