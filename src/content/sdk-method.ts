import { createAction } from '@reduxjs/toolkit';

import { SdkError } from './sdk-errors';
import type { SignTypedDataParams, SignTypedDataResult } from './sdk-types';

export const SdkMethodEventType = {
  Request: 'CasperWalletMethod:Request',
  Response: 'CasperWalletMethod:Response'
};

type Meta = { requestId: string };

/** FSA-compatible (payload, meta) creator with exact type string */
const createSdkAction = <P, T extends string = string>(type: T) =>
  createAction(type, (payload: P, meta: Meta) => ({ payload, meta }));

/** FSA error envelope: {payload, meta, error: true} — wire shape must not change */
const createSdkErrorAction = <T extends string>(type: T) =>
  createAction(type, (payload: SdkError | Error, meta: Meta) => ({
    payload,
    meta,
    error: true as const
  }));

export const sdkMethod = {
  connectRequest: createSdkAction<{ title: string }>(
    'CasperWalletProvider:Connect'
  ),
  connectResponse: createSdkAction<boolean>(
    'CasperWalletProvider:Connect:Response'
  ),
  connectError: createSdkAction<Error>('CasperWalletProvider:Connect:Error'),
  switchAccountRequest: createSdkAction<{ title: string }>(
    'CasperWalletProvider:SwitchAccount'
  ),
  switchAccountResponse: createSdkAction<boolean>(
    'CasperWalletProvider:SwitchAccount:Response'
  ),
  switchAccountError: createSdkAction<Error>(
    'CasperWalletProvider:SwitchAccount:Error'
  ),
  signRequest: createSdkAction<{
    deployJson: string;
    signingPublicKeyHex: string;
  }>('CasperWalletProvider:Sign'),
  signResponse: createSdkAction<
    | { cancelled: true; message?: string }
    | { cancelled: false; signatureHex: string }
  >('CasperWalletProvider:Sign:Response'),
  signError: createSdkAction<Error>('CasperWalletProvider:Sign:Error'),
  signMessageRequest: createSdkAction<{
    message: string;
    signingPublicKeyHex: string;
  }>('CasperWalletProvider:SignMessage'),
  signMessageResponse: createSdkAction<
    { cancelled: true } | { cancelled: false; signatureHex: string }
  >('CasperWalletProvider:SignMessage:Response'),
  signMessageError: createSdkAction<Error>(
    'CasperWalletProvider:SignMessage:Error'
  ),
  signTypedDataRequest: createSdkAction<{
    typedData: SignTypedDataParams['typedData'];
    options?: SignTypedDataParams['options'];
    signingPublicKeyHex: string;
  }>('CasperWalletProvider:SignTypedData'),
  signTypedDataResponse: createSdkAction<SignTypedDataResult>(
    'CasperWalletProvider:SignTypedData:Response'
  ),
  signTypedDataError: createSdkAction<Error>(
    'CasperWalletProvider:SignTypedData:Error'
  ),
  encryptMessageRequest: createSdkAction<{
    message: string;
    signingPublicKeyHex: string;
  }>('CasperWalletProvider:EncryptMessage'),
  encryptMessageResponse: createSdkAction<{ encryptedMessage: string }>(
    'CasperWalletProvider:EncryptMessage:Response'
  ),
  encryptMessageError: createSdkErrorAction(
    'CasperWalletProvider:EncryptMessage:Error'
  ),
  decryptMessageRequest: createSdkAction<{
    message: string;
    signingPublicKeyHex: string;
  }>('CasperWalletProvider:DecryptMessage'),
  decryptMessageResponse: createSdkAction<
    { cancelled: true } | { cancelled: false; decryptedMessage: string }
  >('CasperWalletProvider:DecryptMessage:Response'),
  decryptMessageError: createSdkAction<Error>(
    'CasperWalletProvider:DecryptMessage:Error'
  ),
  disconnectRequest: createSdkAction<void>('CasperWalletProvider:Disconnect'),
  disconnectResponse: createSdkAction<boolean>(
    'CasperWalletProvider:Disconnect:Response'
  ),
  isConnectedRequest: createSdkAction<void>('CasperWalletProvider:IsConnected'),
  isConnectedResponse: createSdkAction<boolean>(
    'CasperWalletProvider:IsConnected:Response'
  ),
  isConnectedError: createSdkErrorAction(
    'CasperWalletProvider:IsConnected:Error'
  ),
  getActivePublicKeyRequest: createSdkAction<void>(
    'CasperWalletProvider:GetActivePublicKey'
  ),
  getActivePublicKeyResponse: createSdkAction<string>(
    'CasperWalletProvider:GetActivePublicKey:Response'
  ),
  getActivePublicKeyError: createSdkErrorAction(
    'CasperWalletProvider:GetActivePublicKey:Error'
  ),
  getVersionRequest: createSdkAction<void>('CasperWalletProvider:GetVersion'),
  getVersionResponse: createSdkAction<string>(
    'CasperWalletProvider:GetVersion:Response'
  ),
  getActivePublicKeySupportsRequest: createSdkAction<void>(
    'CasperWalletProvider:GetActivePublicKeySupports'
  ),
  getActivePublicKeySupportsResponse: createSdkAction<string[]>(
    'CasperWalletProvider:GetActivePublicKeySupports:Response'
  ),
  getActivePublicKeySupportsError: createSdkErrorAction(
    'CasperWalletProvider:GetActivePublicKeySupports:Error'
  )
};

export type SdkMethod = ReturnType<(typeof sdkMethod)[keyof typeof sdkMethod]>;

export function isSDKMethod(action?: unknown): action is SdkMethod {
  const candidate = action as { type?: unknown; meta?: Meta } | undefined;

  return (
    typeof candidate?.type === 'string' &&
    typeof candidate.meta?.requestId === 'string'
  );
}
