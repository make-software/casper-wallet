import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import { DeployUtil, CasperServiceByJsonRPC } from 'casper-js-sdk';

import { SignerMsg, SignerService } from './signer-service';

const REDUX_WALLET_SYNC_KEY = 'cspr-redux-wallet-sync';
type SyncWalletBroadcastMessage = {
  publicKey: string | null;
};

const GRPC_URL = 'https://casper-node-proxy.dev.make.services/rpc';
export let casperService = new CasperServiceByJsonRPC(GRPC_URL);

type WalletService = {
  logs: string[];
  errorMessage: string | null;
  activePublicKey: string | null;
  connectSigner: () => Promise<void>;
  disconnect: () => void;
  signAndDeploy: (
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
  const [logs, setLogs] = useState<string[]>([]);
  const log = (msg: string) => setLogs(state => [...state, msg]);
  const [activePublicKey, setActivePublicKey] = useState<null | string>(null);

  const updatePublicKey = useCallback(
    (key: string | null) => {
      setActivePublicKey(key);
      localStorage.setItem(
        REDUX_WALLET_SYNC_KEY,
        JSON.stringify({
          publicKey: activePublicKey
        } as SyncWalletBroadcastMessage)
      );
    },
    [activePublicKey]
  );

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
    const handleConnected = (msg: SignerMsg) => {
      log('connected');
      const publicKey = msg.detail!.activeKey;
      if (publicKey) {
        updatePublicKey(publicKey);
      }
    };

    const handleDisconnected = (msg: SignerMsg) => {
      log('disconnected');
      if (activePublicKey) {
        updatePublicKey(null);
      }
    };

    const handleActiveKeyChanged = (msg: SignerMsg) => {
      log('activeKeyChanged');
      const publicKey = msg.detail!.activeKey;

      if (activePublicKey && publicKey && msg.detail!.isConnected) {
        updatePublicKey(publicKey);
      }
    };

    const handleUnlocked = (msg: SignerMsg) => {
      log('unlocked');
      if (activePublicKey && msg.detail!.isConnected) {
        const publicKey = msg.detail!.activeKey;
        // when unlocking Signer we need to make sure the active key is the same as in memory
        if (publicKey !== activePublicKey) {
          // show select account
        }
      }
    };

    // subscribe to signer events
    window.addEventListener('signer:connected', handleConnected);
    window.addEventListener('signer:disconnected', handleDisconnected);
    window.addEventListener('signer:activeKeyChanged', handleActiveKeyChanged);
    window.addEventListener('signer:unlocked', handleUnlocked);

    return () => {
      window.removeEventListener('signer:connected', handleConnected);
      window.removeEventListener('signer:disconnected', handleDisconnected);
      window.removeEventListener(
        'signer:activeKeyChanged',
        handleActiveKeyChanged
      );
      window.removeEventListener('signer:unlocked', handleUnlocked);
      SignerService.removeAllSubscribers();
    };
  }, [activePublicKey, updatePublicKey]);

  const disconnect = () => {
    console.log('disconnect');
    SignerService.disconnect();
  };

  const connectSigner = async () => {
    console.log('sendConnectionRequest');
    SignerService.sendConnectionRequest();
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
    signAndDeploy: signAndDeploy
  };

  return <WalletServiceContextProvider value={contextProps} {...props} />;
};
