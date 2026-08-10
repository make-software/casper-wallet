/**
 * Each event will contain a `json string` payload in the `event.detail` property. This payload contains the Casper Wallet internal state so you can keep you application UI in sync.
 */
export type CasperWalletState = {
  /** contain wallet is locked flag */
  isLocked: boolean;
  /** if unlocked contain connected status flag of active key otherwise undefined */
  isConnected: boolean | undefined;
  /** if unlocked and connected contain active key otherwise undefined */
  activeKey: string | undefined;
  /** if unlocked and connected, contain a list of supported features for the current active key otherwise `undefined` */
  activeKeySupports: CasperWalletSupports[] | undefined;
};

export enum CasperWalletSupports {
  signDeploy = 'sign-deploy',
  signTransactionV1 = 'sign-transactionv1',
  signMessage = 'sign-message',
  signTypedDataEIP712 = 'sign-typed-data-eip712',
  messageEncryption = 'message-encryption',
  messageDecryption = 'message-decryption'
}

export interface SignTypedDataParams {
  typedData: {
    domain: Record<string, unknown>;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  };
  options?: {
    domainTypes?: Array<{ name: string; type: string }>;
    returnHashArtifacts?: boolean;
    rejectUnknownFields?: boolean;
  };
}

interface EIP712HashArtifacts {
  domainTypeString?: string;
  domain?: Record<string, unknown>;
  domainSeparator?: string;
  canonicalTypeString?: string;
  typeHash?: string;
  structHash?: string;
}

export interface SignTypedDataResult {
  cancelled: boolean;
  signature: string | null;
  digest: string | null;
  publicKey: string | null;
  error: string | null;
  errorCode?: string;
  hashArtifacts?: EIP712HashArtifacts;
}
