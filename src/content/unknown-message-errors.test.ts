import { SdkEvent } from './sdk-event';
import { SdkMethod } from './sdk-method';
import {
  unknownSdkEventError,
  unknownSdkMessageError
} from './unknown-message-errors';

// A payload marker that must never reach a message: the content script's console
// and its thrown errors are visible to the dapp page.
const SECRET = 'deadbeef';

describe('content unknown-message errors', () => {
  it('names the sdk message type and drops its payload', () => {
    const message = {
      type: 'CasperWalletProvider:Sign:Response',
      payload: { signatureHex: SECRET, cancelled: false },
      meta: { requestId: 'req-1' }
    } as unknown as SdkMethod;

    const { message: text } = unknownSdkMessageError(message);

    expect(text).toContain('CasperWalletProvider:Sign:Response');
    expect(text).not.toContain(SECRET);
  });

  it('names the sdk event type and drops its payload', () => {
    const event = {
      type: 'unlockedEvent',
      payload: { activePublicKey: SECRET }
    } as unknown as SdkEvent;

    const { message: text } = unknownSdkEventError(event);

    expect(text).toContain('unlockedEvent');
    expect(text).not.toContain(SECRET);
  });
});
