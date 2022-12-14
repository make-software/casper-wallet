import { CasperServiceByJsonRPC } from 'casper-js-sdk';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

let casperWalletInstance;
const getCasperWalletInstance = () => {
  try {
    if (casperWalletInstance == null) {
      casperWalletInstance = (window as any).CasperWalletProvider();
    }
    return casperWalletInstance;
  } catch (err) {}
  throw Error('Please install the Casper Wallet Extension.');
};

const REDUX_WALLET_SYNC_KEY = 'cspr-redux-wallet-sync';
type SyncWalletBroadcastMessage = {
  publicKey: string | null;
};

const GRPC_URL = 'https://casper-node-proxy.dev.make.services/rpc';
export let casperService = new CasperServiceByJsonRPC(GRPC_URL);

export type WalletState = {
  isConnected: boolean;
  isUnlocked: boolean;
  activeKey: string;
};

type WalletService = {
  logs: [string, object][];
  errorMessage: string | null;
  activePublicKey: string | null;
  connectSigner: () => Promise<void>;
  disconnect: () => void;
  sign: (
    deployJson: string,
    accountPublicKey: string
  ) => Promise<{ cancelled: true } | { cancelled: false, signature: Uint8Array}>;
  getVersion: () => Promise<string>;
};

export const walletServiceContext = createContext<WalletService>({} as any);

const { Provider: WalletServiceContextProvider } = walletServiceContext;

export const useWalletService = () => {
  return useContext(walletServiceContext);
};

export const WalletServiceProvider = props => {
  const [error, setError] = useState<null | Error>(null);
  const [logs, setLogs] = useState<[string, object][]>([]);
  const log = (msg: string, payload?: any) =>
    setLogs(state => [[msg, payload], ...state]);

  const [activePublicKey, _setActivePublicKey] = useState<null | string>(() => {
    const state: SyncWalletBroadcastMessage | null = JSON.parse(
      localStorage.getItem(REDUX_WALLET_SYNC_KEY) || 'null'
    );
    return state?.publicKey || null;
  });

  const setActivePublicKey = useCallback((key: string | null) => {
    _setActivePublicKey(key);
    localStorage.setItem(
      REDUX_WALLET_SYNC_KEY,
      JSON.stringify({
        publicKey: key
      } as SyncWalletBroadcastMessage)
    );
  }, []);

  // SYNC BETWEEN TABS AND WINDOWS
  useEffect(() => {
    const syncWalletBetweenTabsAndWindows = ev => {
      if (ev.key === REDUX_WALLET_SYNC_KEY) {
        try {
          const message: SyncWalletBroadcastMessage = JSON.parse(ev.newValue);

          const publicKeyChanged = activePublicKey !== message.publicKey;

          if (publicKeyChanged) {
            setActivePublicKey(message.publicKey);
          }
        } catch (err: any) {
          setError(err);
        }
      }
    };

    // subscribe to storage events to sync cache storage with other app instances
    window.addEventListener('storage', syncWalletBetweenTabsAndWindows);

    return () => {
      window.removeEventListener('storage', syncWalletBetweenTabsAndWindows);
    };
  }, [activePublicKey, setActivePublicKey]);

  // SIGNER SUBSCRIPTIONS
  useEffect(() => {
    const handleInitialState = (msg: any) => {
      log('event:initialState', msg.detail);
      try {
        // const action: WalletState = JSON.parse(msg.detail);
        // TODO: implement initial state logic
      } catch (err) {
        console.error(err);
      }
    };

    const handleConnected = (msg: any) => {
      log('event:connected', msg.detail);
      try {
        const action: WalletState = JSON.parse(msg.detail);
        if (action.activeKey) {
          setActivePublicKey(action.activeKey);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleDisconnected = (msg: any) => {
      log('event:disconnected', msg.detail);
      try {
        // const action: WalletState = JSON.parse(msg.detail);
        if (activePublicKey) {
          setActivePublicKey(null);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleActiveKeyChanged = (msg: any) => {
      log('event:activeKeyChanged', msg.detail);
      try {
        const action: WalletState = JSON.parse(msg.detail);
        if (action.isConnected && action.activeKey) {
          setActivePublicKey(action.activeKey);
        } else {
          setActivePublicKey(null);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // subscribe to signer events
    window.addEventListener('signer:initialState', handleInitialState);
    window.addEventListener('signer:connected', handleConnected);
    window.addEventListener('signer:disconnected', handleDisconnected);
    window.addEventListener('signer:activeKeyChanged', handleActiveKeyChanged);

    return () => {
      window.removeEventListener('signer:initialState', handleInitialState);
      window.removeEventListener('signer:connected', handleConnected);
      window.removeEventListener('signer:disconnected', handleDisconnected);
      window.removeEventListener(
        'signer:activeKeyChanged',
        handleActiveKeyChanged
      );
    };
  }, [activePublicKey, setActivePublicKey]);

  const disconnect = () => {
    console.log('disconnectRequest');
    setActivePublicKey(null);
    getCasperWalletInstance().disconnectFromSite();
  };

  const connectSigner = async () => {
    console.log('connectRequest');
    getCasperWalletInstance().requestConnection();
  };

  const sign = async (deployJson: string, accountPublicKey: string) => {
    return getCasperWalletInstance().sign(deployJson, accountPublicKey);
  };

  const contextProps: WalletService = {
    logs,
    errorMessage: error?.message || null,
    activePublicKey: activePublicKey,
    connectSigner: connectSigner,
    disconnect: disconnect,
    sign: sign,
    getVersion: getCasperWalletInstance().getVersion
  };

  return <WalletServiceContextProvider value={contextProps} {...props} />;
};
