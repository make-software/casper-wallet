import { createAction } from 'typesafe-actions';
import { TimeoutDurationSetting } from '@src/app/constants';

export const createVault = createAction(
  'CREATE_VAULT',
  (payload: { password: string }) => ({
    password: payload.password,
    timeoutStartTime: Date.now()
  })
)<{
  password: string;
  timeoutStartTime: number;
}>();

export const lockVault = createAction('LOCK_VAULT')<void>();
export const unlockVault = createAction('UNLOCK_LOCK', () => ({
  timeoutStartTime: Date.now()
}))<{
  timeoutStartTime: number;
}>();

export const createAccount = createAction('CREATE_ACCOUNT')<{
  name: string;
}>();

export const changeTimeoutDuration = createAction(
  'CHANGE_TIMEOUT_DURATION',
  (payload: { timeoutDuration: TimeoutDurationSetting }) => ({
    timeoutDuration: payload.timeoutDuration,
    timeoutStartTime: Date.now()
  })
)<{
  timeoutDuration: TimeoutDurationSetting;
  timeoutStartTime: number;
}>();
