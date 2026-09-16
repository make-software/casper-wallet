import { bringInitContentScript } from '@bringweb3/chrome-extension-kit';
import { runtime } from 'webextension-polyfill';

import { isChromeBuild } from '@src/utils';

const getActivePublicKye = async (): Promise<string | undefined> => {
  try {
    const response = (await runtime.sendMessage({
      type: 'GET_ACTIVE_PUBLIC_KEY'
    })) as { payload?: { publicKey?: string | null } } | undefined;

    return response?.payload?.publicKey ?? undefined;
  } catch (e) {
    console.log(e, 'getActivePublicKye error');

    return undefined;
  }
};

const getTheme = async (): Promise<string> => {
  try {
    const response = (await runtime.sendMessage({
      type: 'GET_THEME'
    })) as { payload?: { theme?: string } } | undefined;

    return response?.payload?.theme ?? 'dark';
  } catch (e) {
    console.log(e, 'getTheme error');

    return 'dark';
  }
};

const theme = await getTheme();

export const initBringScript = () => {
  if (isChromeBuild) {
    bringInitContentScript({
      getWalletAddress: getActivePublicKye,
      promptLogin: () =>
        runtime.sendMessage({
          type: 'PROMPT_LOGIN_REQUEST'
        }),
      walletAddressListeners: [
        'casper-wallet:activeKeyChanged',
        'casper-wallet:unlocked',
        'casper-wallet:locked'
      ],
      theme: theme,
      text: 'lower',
      switchWallet: false
    });
  }
};
