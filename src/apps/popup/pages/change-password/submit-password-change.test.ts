import { changePassword } from '@background/redux/sagas/actions';

import {
  clearUiError,
  reportUiError
} from '@libs/ui/components/saga-error-banner/ui-error-channel';

import { submitPasswordChange } from './submit-password-change';

jest.mock('@libs/ui/components/saga-error-banner/ui-error-channel', () => ({
  clearUiError: jest.fn(),
  reportUiError: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

it('proceeds only once the background has accepted the change', async () => {
  const onAccepted = jest.fn();

  await submitPasswordChange(async () => ({ accepted: true }), onAccepted);

  expect(onAccepted).toHaveBeenCalled();
  expect(clearUiError).toHaveBeenCalledWith(
    'dispatch-failed',
    changePassword.type
  );
  expect(reportUiError).not.toHaveBeenCalled();
});

// Navigating regardless left the user on Home believing the password had
// changed. The old one is still live, and each later unlock attempt counts
// toward the lockout.
it('keeps the caller on the page and surfaces the failure when the request fails', async () => {
  const onAccepted = jest.fn();

  await submitPasswordChange(async () => {
    throw new Error('Background port timed out');
  }, onAccepted);

  expect(onAccepted).not.toHaveBeenCalled();
  expect(reportUiError).toHaveBeenCalledWith(
    'dispatch-failed',
    changePassword.type
  );
  expect(clearUiError).not.toHaveBeenCalled();
});

it('never logs the request payload', async () => {
  await submitPasswordChange(async () => {
    throw new Error('boom');
  }, jest.fn());

  const logged = (console.error as jest.Mock).mock.calls.flat().join(' ');
  expect(logged).not.toContain('password');
});
