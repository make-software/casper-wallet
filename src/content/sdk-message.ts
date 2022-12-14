import { ActionType, createAction } from 'typesafe-actions';

export const sdkMessageProxyEvents = {
  SDKRequestAction: 'CasperWalletProviderEvent:SDKRequestAction',
  SDKResponseAction: 'CasperWalletProviderEvent:SDKResponseAction'
};

type Meta = { requestId: string };

export const sdkMessage = {
  connectRequest: createAction('CasperWalletProvider:Connect')<
    { origin: string; title: string },
    Meta
  >(),
  connectResponse: createAction('CasperWalletProvider:Connect:Response')<
    boolean,
    Meta
  >(),
  disconnectRequest: createAction('CasperWalletProvider:Disconnect')<
    string,
    Meta
  >(),
  disconnectResponse: createAction('CasperWalletProvider:Disconnect:Response')<
    boolean,
    Meta
  >(),
  isConnectedRequest: createAction('CasperWalletProvider:IsConnected')<
    string,
    Meta
  >(),
  isConnectedResponse: createAction(
    'CasperWalletProvider:IsConnected:Response'
  )<boolean, Meta>(),
  getActivePublicKeyRequest: createAction(
    'CasperWalletProvider:GetActivePublicKey'
  )<void, Meta>(),
  getActivePublicKeyResponse: createAction(
    'CasperWalletProvider:GetActivePublicKey:Response'
  )<string | undefined, Meta>(),
  getVersionRequest: createAction('CasperWalletProvider:GetVersion')<
    void,
    Meta
  >(),
  getVersionResponse: createAction('CasperWalletProvider:GetVersion:Response')<
    string,
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
    { cancelled: true } | { cancelled: false; signature: Uint8Array },
    Meta
  >(),
  signError: createAction('CasperWalletProvider:Sign:Error')<Error, Meta>()
};

export type SdkMessage = ActionType<typeof sdkMessage>;

export function isSDKMessage(action?: {
  type?: unknown;
  meta?: unknown;
}): action is SdkMessage {
  return (
    typeof action?.type === 'string' &&
    typeof (action.meta as Meta | undefined)?.requestId === 'string'
  );
}
