import { sdkMethod } from '@content/sdk-method';

import {
  unknownMessageError,
  unknownReduxActionError,
  unknownSdkMessageError
} from './unknown-message-errors';

// A payload marker that must never reach a message: these are handed to
// `sendError`, which returns them across the boundary — to `dispatchToMainStore`
// for the redux branch, into the dapp's own SDK for the sdk branch.
const SECRET = 'deadbeef';

const REQUEST_ID = 'req-1';

describe('background unknown-message errors', () => {
  it('names the sdk method and its requestId, and drops the payload', () => {
    const action = sdkMethod.signResponse(
      { signatureHex: SECRET, cancelled: false },
      { requestId: REQUEST_ID }
    );

    const { message } = unknownSdkMessageError(action);

    expect(message).toContain(sdkMethod.signResponse.type);
    expect(message).toContain(REQUEST_ID);
    expect(message).not.toContain(SECRET);
  });

  it('names the redux action type and drops the payload', () => {
    const { message } = unknownReduxActionError({
      type: 'vault/secretPhraseCreated',
      payload: { secretPhrase: SECRET }
    } as { type: string });

    expect(message).toContain('vault/secretPhraseCreated');
    expect(message).not.toContain(SECRET);
  });

  it('reports what `type` was, not the message', () => {
    expect(
      unknownMessageError({ type: 42, payload: SECRET } as never).message
    ).toBe('Background: Unknown message: type is number');
    expect(unknownMessageError({}).message).toBe(
      'Background: Unknown message: type is undefined'
    );
    // A nullish message reaches this branch too — `runtime.onMessage` hands the
    // listener whatever the sender posted.
    expect(unknownMessageError(undefined).message).toBe(
      'Background: Unknown message: type is undefined'
    );
  });
});
