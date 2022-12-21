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

let CasperWalletEventTypes;

const REDUX_WALLET_SYNC_KEY = 'cspr-redux-wallet-sync';
type SyncWalletBroadcastMessage = {
  publicKey: string | null;
};

const GRPC_URL = 'https://casper-node-proxy.dev.make.services/rpc';
export let casperService = new CasperServiceByJsonRPC(GRPC_URL);

export type WalletState = {
  isLocked: boolean;
  isConnected: boolean;
  activeKey: string;
};

type WalletService = {
  logs: [string, object][];
  errorMessage: string | null;
  activePublicKey: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  switchAccount: () => Promise<boolean>;
  isConnected: () => Promise<boolean>;
  getActivePublicKey: () => Promise<string | undefined>;
  getVersion: () => Promise<string>;
  sign: (
    deployJson: string,
    accountPublicKey: string
  ) => Promise<
    { cancelled: true } | { cancelled: false; signature: Uint8Array }
  >;
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

  const [counter, setCounter] = useState(0);
  const [extensionLoaded, setExtensionLoaded] = useState(false);

  useEffect(() => {
    let timer;
    if ((window as any).CasperWalletEventTypes != null) {
      CasperWalletEventTypes = (window as any).CasperWalletEventTypes;
      setExtensionLoaded(true);
      clearTimeout(timer);
    } else {
      timer = setTimeout(() => {
        setCounter(i => (i = 1));
      }, 500);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [counter]);

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

  // WALLET SUBSCRIPTIONS
  useEffect(() => {
    if (extensionLoaded === false) {
      return;
    }

    const handleLocked = (msg: any) => {
      log('event:locked', msg.detail);
      try {
        // const action: WalletState = JSON.parse(msg.detail);
        // TODO: diplay locked label
      } catch (err) {
        console.error(err);
      }
    };

    const handleUnlocked = (msg: any) => {
      log('event:unlocked', msg.detail);
      try {
        const action: WalletState = JSON.parse(msg.detail);
        if (action.activeKey) {
          setActivePublicKey(action.activeKey);
        } else {
          setActivePublicKey(null);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleTabChanged = (msg: any) => {
      log('event:tabChanged', msg.detail);
      try {
        const action: WalletState = JSON.parse(msg.detail);
        if (action.activeKey) {
          setActivePublicKey(action.activeKey);
        } else {
          setActivePublicKey(null);
        }
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
        if (action.activeKey) {
          setActivePublicKey(action.activeKey);
        } else {
          setActivePublicKey(null);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // subscribe to signer events
    window.addEventListener(CasperWalletEventTypes.Locked, handleLocked);
    window.addEventListener(CasperWalletEventTypes.Unlocked, handleUnlocked);
    window.addEventListener(
      CasperWalletEventTypes.TabChanged,
      handleTabChanged
    );
    window.addEventListener(CasperWalletEventTypes.Connected, handleConnected);
    window.addEventListener(
      CasperWalletEventTypes.Disconnected,
      handleDisconnected
    );
    window.addEventListener(
      CasperWalletEventTypes.ActiveKeyChanged,
      handleActiveKeyChanged
    );

    return () => {
      window.removeEventListener(CasperWalletEventTypes.Locked, handleLocked);
      window.removeEventListener(
        CasperWalletEventTypes.Unlocked,
        handleUnlocked
      );
      window.removeEventListener(
        CasperWalletEventTypes.TabChanged,
        handleTabChanged
      );
      window.removeEventListener(
        CasperWalletEventTypes.Connected,
        handleConnected
      );
      window.removeEventListener(
        CasperWalletEventTypes.Disconnected,
        handleDisconnected
      );
      window.removeEventListener(
        CasperWalletEventTypes.ActiveKeyChanged,
        handleActiveKeyChanged
      );
    };
  }, [activePublicKey, setActivePublicKey, extensionLoaded]);

  const connect = async () => {
    console.log('connectRequest');
    return getCasperWalletInstance().requestConnection();
  };

  const disconnect = () => {
    console.log('disconnectRequest');
    setActivePublicKey(null);
    return getCasperWalletInstance().disconnectFromSite();
  };

  const switchAccount = () => {
    console.log('switchAccount');
    return getCasperWalletInstance().requestSwitchAccount();
  };

  const isConnected = async () => {
    return getCasperWalletInstance().isConnected();
  };

  const getActivePublicKey = async () => {
    return getCasperWalletInstance().getActivePublicKey();
  };

  const sign = async (deployJson: string, accountPublicKey: string) => {
    return getCasperWalletInstance().sign(deployJson, accountPublicKey);
  };

  const contextProps: WalletService = {
    logs,
    errorMessage: error?.message || null,
    activePublicKey: activePublicKey,
    connect: connect,
    disconnect: disconnect,
    switchAccount: switchAccount,
    isConnected: isConnected,
    getActivePublicKey: getActivePublicKey,
    sign: sign,
    getVersion: getCasperWalletInstance().getVersion
  };

  return <WalletServiceContextProvider value={contextProps} {...props} />;
};
