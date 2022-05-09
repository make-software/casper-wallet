import { createAction } from 'typesafe-actions';
import { TimeoutDurationSetting } from '@src/app/constants';

export const createVault = createAction(
  'CREATE_VAULT',
  (payload: { password: string }) => ({
    password: payload.password,
    lastActivityTime: Date.now()
  })
)<{
  password: string;
  lastActivityTime: number;
}>();

export const lockVault = createAction('LOCK_VAULT')<void>();

export const unlockVault = createAction('UNLOCK_VAULT', () => ({
  lastActivityTime: Date.now()
}))<{
  lastActivityTime: number;
}>();

export const createAccount = createAction('CREATE_ACCOUNT')<{
  name: string;
}>();

export const changeTimeoutDuration = createAction(
  'CHANGE_TIMEOUT_DURATION',
  (payload: { timeoutDuration: TimeoutDurationSetting }) => ({
    timeoutDuration: payload.timeoutDuration,
    lastActivityTime: Date.now()
  })
)<{
  timeoutDuration: TimeoutDurationSetting;
  lastActivityTime: number;
}>();

export const refreshTimeout = createAction('REFRESH_TIMEOUT', () => ({
  lastActivityTime: Date.now()
}))<{
  lastActivityTime: number;
}>();
