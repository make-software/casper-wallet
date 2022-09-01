import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import { DeployUtil, CasperServiceByJsonRPC } from 'casper-js-sdk';

import { WalletState, SignerService } from './signer-service';

const REDUX_WALLET_SYNC_KEY = 'cspr-redux-wallet-sync';
type SyncWalletBroadcastMessage = {
  publicKey: string | null;
};

const GRPC_URL = 'https://casper-node-proxy.dev.make.services/rpc';
export let casperService = new CasperServiceByJsonRPC(GRPC_URL);

type WalletService = {
  logs: [string, object][];
  errorMessage: string | null;
  activePublicKey: string | null;
  connectSigner: () => Promise<void>;
  disconnect: () => void;
  signAndDeploy: (
    deploy: any,
    accountPublicKey: any,
    recipientPublicKey?: any
  ) => Promise<any>;
  sign: (
    deploy: any,
    accountPublicKey: any,
    recipientPublicKey?: any
  ) => Promise<any>;
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

  const [activePublicKey, setActivePublicKey] = useState<null | string>(() => {
    const state: SyncWalletBroadcastMessage | null = JSON.parse(
      localStorage.getItem(REDUX_WALLET_SYNC_KEY) || 'null'
    );
    return state?.publicKey || null;
  });

  const updatePublicKey = useCallback((key: string | null) => {
    setActivePublicKey(key);
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
            updatePublicKey(message.publicKey);
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
  }, [activePublicKey, updatePublicKey]);

  // SIGNER SUBSCRIPTIONS
  useEffect(() => {
    const handleConnected = (msg: any) => {
      log('event:connected', msg.detail);
      try {
        const action: WalletState = JSON.parse(msg.detail);
        if (action.activeKey) {
          updatePublicKey(action.activeKey);
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
          updatePublicKey(null);
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
          updatePublicKey(action.activeKey);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // const handleUnlocked = (msg: any) => {
    //   log('event:unlocked', msg.detail);
    //   try {
    //     // const action: WalletState = JSON.parse(msg.detail);
    //     // TODO
    //   } catch (err) {
    //     console.error(err);
    //   }
    // };

    // subscribe to signer events
    window.addEventListener('signer:connected', handleConnected);
    window.addEventListener('signer:disconnected', handleDisconnected);
    window.addEventListener('signer:activeKeyChanged', handleActiveKeyChanged);
    // window.addEventListener('signer:unlocked', handleUnlocked);

    return () => {
      window.removeEventListener('signer:connected', handleConnected);
      window.removeEventListener('signer:disconnected', handleDisconnected);
      window.removeEventListener(
        'signer:activeKeyChanged',
        handleActiveKeyChanged
      );
      // window.removeEventListener('signer:unlocked', handleUnlocked);
      SignerService.removeAllSubscribers();
    };
  }, [activePublicKey, updatePublicKey]);

  const disconnect = () => {
    console.log('disconnectRequest');
    SignerService.disconnect();
  };

  const connectSigner = async () => {
    console.log('connectRequest');
    SignerService.sendConnectionRequest();
  };

  const sign = (deploy, accountPublicKey, recipientPublicKey) => {
    return SignerService.sign(
      { deploy: {} },
      accountPublicKey,
      recipientPublicKey
    );
  };

  const signAndDeploy = (deploy, accountPublicKey, recipientPublicKey) => {
    const deployJson: any = DeployUtil.deployToJson(deploy);
    // for debugging to casper team
    // console.log(JSON.stringify(deployJson));

    if (activePublicKey && accountPublicKey) {
      // return window['casperlabsHelper'].sign(
      return SignerService.sign(
        deployJson,
        accountPublicKey,
        recipientPublicKey
      ).then(signedDeployJson => {
        const signedDeploy = DeployUtil.deployFromJson(signedDeployJson);

        if (signedDeploy.ok) {
          return casperService
            .deploy(signedDeploy.val)
            .then(res => {
              return res;
            })
            .catch(err => {
              setError(err);
            });
        } else {
          setError(signedDeploy.val);
        }
      });
    }

    return Promise.reject('Account not connected');
  };

  const contextProps: WalletService = {
    logs,
    errorMessage: error?.message || null,
    activePublicKey: activePublicKey,
    connectSigner: connectSigner,
    disconnect: disconnect,
    signAndDeploy: signAndDeploy,
    sign: sign
  };

  return <WalletServiceContextProvider value={contextProps} {...props} />;
};
