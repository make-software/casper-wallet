import { runtime } from 'webextension-polyfill';

import { sdkMethod } from '@content/sdk-method';

import {
  SDK_RESPONSE_TO_TAB,
  sendSdkResponseToSpecificTab
} from './send-sdk-response-to-specific-tab';

// `webextension-polyfill` throws outside a browser extension. Stub the only API
// the forwarder touches.
jest.mock('webextension-polyfill', () => ({
  runtime: { sendMessage: jest.fn() }
}));

const sendMessageMock = runtime.sendMessage as jest.MockedFunction<
  typeof runtime.sendMessage
>;

const action = sdkMethod.signResponse(
  { signatureHex: 'deadbeef', cancelled: false },
  { requestId: 'req-1' }
);

describe('sendSdkResponseToSpecificTab (UI→background forwarder)', () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
  });

  it('forwards the response to the background as an SDK_RESPONSE_TO_TAB message', async () => {
    sendMessageMock.mockResolvedValue(undefined);

    await sendSdkResponseToSpecificTab(action, 7);

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith({
      type: SDK_RESPONSE_TO_TAB,
      action,
      tabId: 7
    });
  });

  it('always resolves even when runtime.sendMessage REJECTS (SW torn down mid-flight)', async () => {
    // Regression: callers `await` this then closeCurrentWindow() with no
    // try/catch, so a rejection must never propagate — else the window hangs.
    sendMessageMock.mockRejectedValue(
      new Error('Extension context invalidated')
    );

    await expect(
      sendSdkResponseToSpecificTab(action, 7)
    ).resolves.toBeUndefined();
  });
});
