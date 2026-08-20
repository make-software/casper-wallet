import { Runtime, runtime } from 'webextension-polyfill';

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
