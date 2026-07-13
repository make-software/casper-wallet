import { windows } from 'webextension-polyfill';

import { getActiveAccountSupports } from '@src/utils';

import { bringWeb3Events } from '@background/bring-web3-events';
import { MainStore } from '@background/redux/get-main-store';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { sdkEvent } from '@content/sdk-event';

import { selectVaultIsLocked } from '../redux/session/selectors';
import {
  selectSystemColorScheme,
  selectThemeModeSetting
} from '../redux/settings/selectors';
import { ThemeMode } from '../redux/settings/types';
import { emitSdkEventToActiveTabs } from '../utils';
import { HandlerResult } from './types';

export async function handleBringWeb3(
  action: { type: string },
  store: MainStore
): Promise<HandlerResult> {
  if (bringWeb3Events.getActivePublicKey.match(action)) {
    const activeAccount = selectVaultActiveAccount(store.getState());

    return {
      handled: true,
      response: bringWeb3Events.getActivePublicKeyResponse({
        publicKey: activeAccount?.publicKey!
      })
    };
  } else if (bringWeb3Events.promptLoginRequest.match(action)) {
    const isLocked = selectVaultIsLocked(store.getState());

    if (isLocked) {
      // Awaited (not fire-and-forget): a rejection from getCurrent/create then
      // propagates to the message router instead of becoming an unhandled
      // rejection, and the handler resolves only once the popup is opened.
      const currentWindow = await windows.getCurrent();
      const windowWidth = currentWindow.width ?? 0;
      const xOffset = currentWindow.left ?? 0;
      const yOffset = currentWindow.top ?? 0;
      const popupWidth = 360;
      const popupHeight = 700;

      await windows.create({
        url: 'popup.html#/bring-web3-unlock',
        type: 'popup',
        height: popupHeight,
        width: popupWidth,
        left: windowWidth + xOffset - popupWidth,
        top: yOffset,
        focused: true
      });
    } else {
      emitSdkEventToActiveTabs(tab => {
        if (!tab.url) {
          return;
        }

        const activeAccount = selectVaultActiveAccount(store.getState());

        return sdkEvent.changedConnectedAccountEvent({
          isLocked: isLocked,
          isConnected: undefined,
          activeKey: activeAccount?.publicKey,
          activeKeySupports: activeAccount
            ? getActiveAccountSupports(activeAccount)
            : undefined
        });
      });
    }

    return { handled: true, response: undefined };
  } else if (bringWeb3Events.getTheme.match(action)) {
    const themeMode = selectThemeModeSetting(store.getState());
    const systemColorScheme = selectSystemColorScheme(store.getState());

    const isDarkMode =
      themeMode === ThemeMode.SYSTEM
        ? systemColorScheme === null || systemColorScheme === 'dark'
        : themeMode === ThemeMode.DARK;

    return {
      handled: true,
      response: bringWeb3Events.getThemeResponse({
        theme: isDarkMode ? 'dark' : 'light'
      })
    };
  }

  return { handled: false };
}
