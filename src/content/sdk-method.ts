import { ActionType, createAction, createCustomAction } from 'typesafe-actions';

import { SdkError } from './sdk-errors';

export const SdkMethodEventType = {
  Request: 'CasperWalletMethod:Request',
  Response: 'CasperWalletMethod:Response'
};

type Meta = { requestId: string };

export const sdkMethod = {
  connectRequest: createAction('CasperWalletProvider:Connect')<
    { title: string },
    Meta
  >(),
  connectResponse: createAction('CasperWalletProvider:Connect:Response')<
    boolean,
    Meta
  >(),
  connectError: createAction('CasperWalletProvider:Connect:Error')<
    Error,
    Meta
  >(),
  switchAccountRequest: createAction('CasperWalletProvider:SwitchAccount')<
    { title: string },
    Meta
  >(),
  switchAccountResponse: createAction(
    'CasperWalletProvider:SwitchAccount:Response'
  )<boolean, Meta>(),
  switchAccountError: createAction('CasperWalletProvider:SwitchAccount:Error')<
    Error,
    Meta
  >(),
  signRequest: createAction('CasperWalletProvider:Sign')<
    {
      deployJson: string;
      signingPublicKeyHex: string;
    },
    Meta
  >(),
  signResponse: createAction('CasperWalletProvider:Sign:Response')<
    { cancelled: true } | { cancelled: false; signatureHex: string },
    Meta
  >(),
  signError: createAction('CasperWalletProvider:Sign:Error')<Error, Meta>(),
  signMessageRequest: createAction('CasperWalletProvider:SignMessage')<
    {
      message: string;
      signingPublicKeyHex: string;
    },
    Meta
  >(),
  signMessageResponse: createAction(
    'CasperWalletProvider:SignMessage:Response'
  )<{ cancelled: true } | { cancelled: false; signatureHex: string }, Meta>(),
  signMessageError: createAction('CasperWalletProvider:SignMessage:Error')<
    Error,
    Meta
  >(),
  disconnectRequest: createAction('CasperWalletProvider:Disconnect')<
    void,
    Meta
  >(),
  disconnectResponse: createAction('CasperWalletProvider:Disconnect:Response')<
    boolean,
    Meta
  >(),
  isConnectedRequest: createAction('CasperWalletProvider:IsConnected')<
    void,
    Meta
  >(),
  isConnectedResponse: createAction(
    'CasperWalletProvider:IsConnected:Response'
  )<boolean, Meta>(),
  isConnectedError: createCustomAction(
    'CasperWalletProvider:IsConnected:Error',
    (payload: SdkError, meta: Meta) => ({ payload, meta, error: true })
  ),
  getActivePublicKeyRequest: createAction(
    'CasperWalletProvider:GetActivePublicKey'
  )<void, Meta>(),
  getActivePublicKeyResponse: createAction(
    'CasperWalletProvider:GetActivePublicKey:Response'
  )<string, Meta>(),
  getActivePublicKeyError: createCustomAction(
    'CasperWalletProvider:GetActivePublicKey:Error',
    (payload: SdkError, meta: Meta) => ({ payload, meta, error: true })
  ),
  getVersionRequest: createAction('CasperWalletProvider:GetVersion')<
    void,
    Meta
  >(),
  getVersionResponse: createAction('CasperWalletProvider:GetVersion:Response')<
    string,
    Meta
  >()
};

export type SdkMethod = ActionType<typeof sdkMethod>;

export function isSDKMethod(action?: {
  type?: unknown;
  meta?: unknown;
}): action is SdkMethod {
  return (
    typeof action?.type === 'string' &&
    typeof (action.meta as Meta | undefined)?.requestId === 'string'
  );
}
