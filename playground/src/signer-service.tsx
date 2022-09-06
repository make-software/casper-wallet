import { Signer } from 'casper-js-sdk';

if (Signer == null) {
  throw Error("Signer is null: shouldn't be possible");
}

export type WalletState = {
    isConnected: boolean;
    isUnlocked: boolean;
    activeKey: string;
};

export type EventType = 'connected' | 'disconnected' | 'publicKeyChanged';

let subscribers: Partial<Record<EventType, (...args: any[]) => void>> = {};

const subscribe = (type: EventType, handler: (publickKey?: string) => void) => {
  switch (type) {
    case 'connected':
    case 'disconnected':
    case 'publicKeyChanged':
      return (subscribers[type] = handler);

    default:
      throw Error('unknown event type');
  }
};

const removeAllSubscribers = () => {
  subscribers = {};
};

const isSignerInstalled = async () => {
  try {
    await Signer.isConnected();
    return true;
  } catch (err) {
    // when calling isConnected is throwing error it means signer is not installed
    return false;
  }
};

const getActivePublicKey = async () => {
  if (!(await isSignerInstalled())) {
    return;
  }

  return Signer.getActivePublicKey();
};

const disconnect = async () => {
  if (!(await isSignerInstalled())) {
    return;
  }

  Signer.disconnectFromSite();
};

const sendConnectionRequest = async () => {
  if (!(await isSignerInstalled())) {
    alert(`Please install the Casper Wallet Extension.`);
    return;
  }
  Signer.sendConnectionRequest();
};

const sign = Signer.sign;

const getVersion = async (): Promise<string | null> => {
  if (!(await isSignerInstalled())) {
    return null;
  }

  return Signer.getVersion();
};

export const SignerService = {
  isSignerInstalled,
  subscribe,
  removeAllSubscribers,
  sendConnectionRequest,
  getActivePublicKey,
  disconnect,
  getVersion,
  sign
};
