import { Runtime, runtime } from 'webextension-polyfill';

import { RootState } from '@background/redux/store-types';

export const PRIVATE_STATE_REQUEST_TYPE = 'PRIVATE_STATE_REQUEST' as const;

export interface PrivateStateRequest {
  type: typeof PRIVATE_STATE_REQUEST_TYPE;
}

/** P0.1: at-rest secrets served on demand instead of broadcast to every replica */
export interface PrivateState {
  passwordHash: string | null;
  passwordSaltHash: string | null;
  keyDerivationSaltHash: string | null;
  vaultCipher: string | null;
}

export function isPrivateStateRequest(
  action: unknown
): action is PrivateStateRequest {
  return (
    (action as PrivateStateRequest | undefined)?.type ===
    PRIVATE_STATE_REQUEST_TYPE
  );
}

/** UI side: explicit request replacing the removed replica fields */
export function fetchPrivateState(): Promise<PrivateState> {
  return runtime.sendMessage({ type: PRIVATE_STATE_REQUEST_TYPE });
}

/** Only extension UI pages (popup/onboarding/windows) — never content scripts / web pages */
export function isTrustedUiSender(sender: Runtime.MessageSender): boolean {
  return (
    sender.id === runtime.id &&
    sender.url != null &&
    sender.url.startsWith(runtime.getURL(''))
  );
}

/**
 * Why a rejected sender is worth a line: a same-extension id means either an
 * unrecognized UI origin (packaging variant, sandboxed frame) or a content
 * script relaying what it should not. Origin only — a content-script sender's
 * page URL can carry tokens in its query string.
 */
export function warnUntrustedSameExtensionSender(
  sender: Runtime.MessageSender,
  context: string
): void {
  if (sender.id !== runtime.id) {
    return;
  }

  let senderOrigin: string | undefined;
  try {
    senderOrigin = sender.url != null ? new URL(sender.url).origin : undefined;
  } catch {
    senderOrigin = undefined;
  }

  console.warn(
    `Background: ${context} from same-extension sender rejected by URL check:`,
    senderOrigin
  );
}

export function selectPrivateState(state: RootState): PrivateState {
  return {
    passwordHash: state.keys.passwordHash,
    passwordSaltHash: state.keys.passwordSaltHash,
    keyDerivationSaltHash: state.keys.keyDerivationSaltHash,
    vaultCipher: state.vaultCipher
  };
}
