/**
 * Wire-contract freeze test (DEP-99 / WALLET-1343, Task 1.3).
 *
 * These `.type` strings are the external contract that dapps and
 * `@bringweb3/chrome-extension-kit` match literally. This test pins every
 * value verbatim so any accidental drift (in this PR's SDK plumbing or a
 * future refactor) fails loudly.
 *
 * None of the modules under test touch DOM/`window` at import time (they
 * only import `@reduxjs/toolkit` + local types), so a plain top-level
 * import works under `testEnvironment: 'node'` — no window/document stub
 * needed here.
 */
import { bringWeb3Events } from '@background/bring-web3-events';

import { sdkEvent } from '@content/sdk-event';
import { SdkMethodEventType, sdkMethod } from '@content/sdk-method';

describe('sdkMethod', () => {
  it('exposes exactly the expected entries', () => {
    // A count would pass on any add-plus-remove and would not say WHICH entry
    // appeared; the exact set fails loudly on either, and documents the surface.
    expect(Object.keys(sdkMethod).sort()).toEqual([
      'connectError',
      'connectRequest',
      'connectResponse',
      'decryptMessageError',
      'decryptMessageRequest',
      'decryptMessageResponse',
      'disconnectRequest',
      'disconnectResponse',
      'encryptMessageError',
      'encryptMessageRequest',
      'encryptMessageResponse',
      'getActivePublicKeyError',
      'getActivePublicKeyRequest',
      'getActivePublicKeyResponse',
      'getActivePublicKeySupportsError',
      'getActivePublicKeySupportsRequest',
      'getActivePublicKeySupportsResponse',
      'getVersionRequest',
      'getVersionResponse',
      'isConnectedError',
      'isConnectedRequest',
      'isConnectedResponse',
      'signError',
      'signMessageError',
      'signMessageRequest',
      'signMessageResponse',
      'signRequest',
      'signResponse',
      'signTypedDataError',
      'signTypedDataRequest',
      'signTypedDataResponse',
      'switchAccountError',
      'switchAccountRequest',
      'switchAccountResponse'
    ]);
  });

  it('freezes every .type literal', () => {
    expect(sdkMethod.connectRequest.type).toBe('CasperWalletProvider:Connect');
    expect(sdkMethod.connectResponse.type).toBe(
      'CasperWalletProvider:Connect:Response'
    );
    expect(sdkMethod.connectError.type).toBe(
      'CasperWalletProvider:Connect:Error'
    );
    expect(sdkMethod.switchAccountRequest.type).toBe(
      'CasperWalletProvider:SwitchAccount'
    );
    expect(sdkMethod.switchAccountResponse.type).toBe(
      'CasperWalletProvider:SwitchAccount:Response'
    );
    expect(sdkMethod.switchAccountError.type).toBe(
      'CasperWalletProvider:SwitchAccount:Error'
    );
    expect(sdkMethod.signRequest.type).toBe('CasperWalletProvider:Sign');
    expect(sdkMethod.signResponse.type).toBe(
      'CasperWalletProvider:Sign:Response'
    );
    expect(sdkMethod.signError.type).toBe('CasperWalletProvider:Sign:Error');
    expect(sdkMethod.signMessageRequest.type).toBe(
      'CasperWalletProvider:SignMessage'
    );
    expect(sdkMethod.signMessageResponse.type).toBe(
      'CasperWalletProvider:SignMessage:Response'
    );
    expect(sdkMethod.signMessageError.type).toBe(
      'CasperWalletProvider:SignMessage:Error'
    );
    expect(sdkMethod.signTypedDataRequest.type).toBe(
      'CasperWalletProvider:SignTypedData'
    );
    expect(sdkMethod.signTypedDataResponse.type).toBe(
      'CasperWalletProvider:SignTypedData:Response'
    );
    expect(sdkMethod.signTypedDataError.type).toBe(
      'CasperWalletProvider:SignTypedData:Error'
    );
    expect(sdkMethod.encryptMessageRequest.type).toBe(
      'CasperWalletProvider:EncryptMessage'
    );
    expect(sdkMethod.encryptMessageResponse.type).toBe(
      'CasperWalletProvider:EncryptMessage:Response'
    );
    expect(sdkMethod.encryptMessageError.type).toBe(
      'CasperWalletProvider:EncryptMessage:Error'
    );
    expect(sdkMethod.decryptMessageRequest.type).toBe(
      'CasperWalletProvider:DecryptMessage'
    );
    expect(sdkMethod.decryptMessageResponse.type).toBe(
      'CasperWalletProvider:DecryptMessage:Response'
    );
    expect(sdkMethod.decryptMessageError.type).toBe(
      'CasperWalletProvider:DecryptMessage:Error'
    );
    expect(sdkMethod.disconnectRequest.type).toBe(
      'CasperWalletProvider:Disconnect'
    );
    expect(sdkMethod.disconnectResponse.type).toBe(
      'CasperWalletProvider:Disconnect:Response'
    );
    expect(sdkMethod.isConnectedRequest.type).toBe(
      'CasperWalletProvider:IsConnected'
    );
    expect(sdkMethod.isConnectedResponse.type).toBe(
      'CasperWalletProvider:IsConnected:Response'
    );
    expect(sdkMethod.isConnectedError.type).toBe(
      'CasperWalletProvider:IsConnected:Error'
    );
    expect(sdkMethod.getActivePublicKeyRequest.type).toBe(
      'CasperWalletProvider:GetActivePublicKey'
    );
    expect(sdkMethod.getActivePublicKeyResponse.type).toBe(
      'CasperWalletProvider:GetActivePublicKey:Response'
    );
    expect(sdkMethod.getActivePublicKeyError.type).toBe(
      'CasperWalletProvider:GetActivePublicKey:Error'
    );
    expect(sdkMethod.getVersionRequest.type).toBe(
      'CasperWalletProvider:GetVersion'
    );
    expect(sdkMethod.getVersionResponse.type).toBe(
      'CasperWalletProvider:GetVersion:Response'
    );
    expect(sdkMethod.getActivePublicKeySupportsRequest.type).toBe(
      'CasperWalletProvider:GetActivePublicKeySupports'
    );
    expect(sdkMethod.getActivePublicKeySupportsResponse.type).toBe(
      'CasperWalletProvider:GetActivePublicKeySupports:Response'
    );
    expect(sdkMethod.getActivePublicKeySupportsError.type).toBe(
      'CasperWalletProvider:GetActivePublicKeySupports:Error'
    );
  });

  describe('error-envelope shape', () => {
    const dummyError = new Error('x');
    const meta = { requestId: 'r' };

    it('produces { error: true } for the 4 error-envelope creators', () => {
      expect(sdkMethod.encryptMessageError(dummyError, meta).error).toBe(true);
      expect(sdkMethod.isConnectedError(dummyError, meta).error).toBe(true);
      expect(sdkMethod.getActivePublicKeyError(dummyError, meta).error).toBe(
        true
      );
      expect(
        sdkMethod.getActivePublicKeySupportsError(dummyError, meta).error
      ).toBe(true);
    });

    it('does NOT carry an error key for the 6 plain *Error creators', () => {
      expect('error' in sdkMethod.connectError(dummyError, meta)).toBe(false);
      expect('error' in sdkMethod.switchAccountError(dummyError, meta)).toBe(
        false
      );
      expect('error' in sdkMethod.signError(dummyError, meta)).toBe(false);
      expect('error' in sdkMethod.signMessageError(dummyError, meta)).toBe(
        false
      );
      expect('error' in sdkMethod.signTypedDataError(dummyError, meta)).toBe(
        false
      );
      expect('error' in sdkMethod.decryptMessageError(dummyError, meta)).toBe(
        false
      );
    });
  });
});

describe('SdkMethodEventType (bonus)', () => {
  it('freezes Request/Response literals', () => {
    expect(SdkMethodEventType.Request).toBe('CasperWalletMethod:Request');
    expect(SdkMethodEventType.Response).toBe('CasperWalletMethod:Response');
  });
});

describe('sdkEvent', () => {
  it('exposes exactly the expected entries', () => {
    expect(Object.keys(sdkEvent).sort()).toEqual(
      [
        'changedActiveAccountSupportsEvent',
        'changedConnectedAccountEvent',
        'changedTab',
        'connectedAccountEvent',
        'disconnectedAccountEvent',
        'lockedEvent',
        'unlockedEvent'
      ].sort()
    );
  });

  it('freezes every .type literal', () => {
    expect(sdkEvent.connectedAccountEvent.type).toBe('connectedAccountEvent');
    expect(sdkEvent.disconnectedAccountEvent.type).toBe(
      'disconnectedAccountEvent'
    );
    // NOTE key/type mismatch — freeze it as-is: key is `changedTab`, wire
    // string is `changedTabEvent`.
    expect(sdkEvent.changedTab.type).toBe('changedTabEvent');
    expect(sdkEvent.changedConnectedAccountEvent.type).toBe(
      'changedConnectedAccountEvent'
    );
    expect(sdkEvent.lockedEvent.type).toBe('lockedEvent');
    expect(sdkEvent.unlockedEvent.type).toBe('unlockedEvent');
    expect(sdkEvent.changedActiveAccountSupportsEvent.type).toBe(
      'changedActiveAccountSupportsEvent'
    );
  });
});

describe('bringWeb3Events', () => {
  it('exposes exactly the expected entries', () => {
    expect(Object.keys(bringWeb3Events).sort()).toEqual(
      [
        'getActivePublicKey',
        'getActivePublicKeyResponse',
        'getTheme',
        'getThemeResponse',
        'promptLoginRequest'
      ].sort()
    );
  });

  it('freezes every .type literal', () => {
    expect(bringWeb3Events.getActivePublicKey.type).toBe(
      'GET_ACTIVE_PUBLIC_KEY'
    );
    expect(bringWeb3Events.getActivePublicKeyResponse.type).toBe(
      'GET_ACTIVE_PUBLIC_KEY_RESPONSE'
    );
    expect(bringWeb3Events.promptLoginRequest.type).toBe(
      'PROMPT_LOGIN_REQUEST'
    );
    expect(bringWeb3Events.getTheme.type).toBe('GET_THEME');
    expect(bringWeb3Events.getThemeResponse.type).toBe('GET_THEME_RESPONSE');
  });
});
