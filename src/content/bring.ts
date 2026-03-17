import { bringInitContentScript } from '@bringweb3/chrome-extension-kit';
import { runtime } from 'webextension-polyfill';

import { isChromeBuild } from '@src/utils';

const getActivePublicKye = async (): Promise<string | undefined> => {
  try {
    const response = await runtime.sendMessage({
      type: 'GET_ACTIVE_PUBLIC_KEY'
    });

    return response?.payload?.publicKey;
  } catch (e) {
    console.log(e, 'getActivePublicKye error');

    return undefined;
  }
};

const getTheme = async (): Promise<string> => {
  try {
    const response = await runtime.sendMessage({
      type: 'GET_THEME'
    });

    return response?.payload?.theme;
  } catch (e) {
    console.log(e, 'getTheme error');

    return 'dark';
  }
};

const theme = await getTheme();

export const initBringScript = () => {
  if (isChromeBuild) {
    bringInitContentScript({
      getWalletAddress: getActivePublicKye, // Async function that returns the current user's wallet address
      promptLogin: () =>
        runtime.sendMessage({
          type: 'PROMPT_LOGIN_REQUEST'
        }), // Function that prompts a UI element asking the user to login
      walletAddressListeners: [
        'casper-wallet:activeKeyChanged',
        'casper-wallet:unlocked',
        'casper-wallet:locked'
      ], // A list of custom events that dispatched when the user's wallet address had changed
      theme: theme,
      text: 'lower',
      switchWallet: false
    });
  }
};
