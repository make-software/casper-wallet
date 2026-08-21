import { changePassword } from '@background/redux/sagas/actions';

import {
  clearUiError,
  reportUiError
} from '@libs/ui/components/saga-error-banner/ui-error-channel';

/**
 * The port ack is the only signal that a password change reached the background,
 * and `ui-error-channel` is UI-local — it never reaches the store or a replica.
 * So the caller must stay on this screen until the ack lands: navigating first
 * left the user on Home believing the password had changed, while the old one
 * was still live and every later unlock attempt counted toward the lockout.
 */
export async function submitPasswordChange(
  send: () => Promise<unknown>,
  onAccepted: () => void
): Promise<void> {
  try {
    await send();
    clearUiError('dispatch-failed', changePassword.type);
    onAccepted();
  } catch (error) {
    console.error('Password change request failed:', error);
    reportUiError('dispatch-failed', changePassword.type);
  }
}
