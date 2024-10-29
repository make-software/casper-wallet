import { bringInitContentScript } from '@bringweb3/chrome-extension-kit';
import { getType } from 'typesafe-actions';
import { runtime } from 'webextension-polyfill';

import { SdkEvent, sdkEvent } from './sdk-event';
import { CasperWalletEventType } from './sdk-event-type';
import {
  SdkMethod,
  SdkMethodEventType,
  isSDKMethod,
  sdkMethod
} from './sdk-method';

async function handleSdkMessage(message: SdkEvent | SdkMethod) {
  // delayed sdk request response
  if (isSDKMethod(message)) {
    switch (message.type) {
      case getType(sdkMethod.connectResponse):
      case getType(sdkMethod.connectError):
      case getType(sdkMethod.switchAccountResponse):
      case getType(sdkMethod.switchAccountError):
      case getType(sdkMethod.signError):
      case getType(sdkMethod.signResponse):
      case getType(sdkMethod.signMessageError):
      case getType(sdkMethod.signMessageResponse):
        window.dispatchEvent(
          new CustomEvent(SdkMethodEventType.Response, {
            detail: JSON.stringify(message)
          })
        );
        return;

      default:
        throw Error(
          'Content: handleOnMessage unknown sdk message: ' +
            JSON.stringify(message)
        );
    }
  } else {
    emitSdkEvent(message);
  }
}

// Proxy Wallet Events to connected site
function emitSdkEvent(message: SdkEvent) {
  let eventType: string;
  switch (message.type) {
    case getType(sdkEvent.connectedAccountEvent):
      eventType = CasperWalletEventType.Connected;
      break;

    case getType(sdkEvent.disconnectedAccountEvent):
      eventType = CasperWalletEventType.Disconnected;
      break;

    case getType(sdkEvent.changedConnectedAccountEvent):
      eventType = CasperWalletEventType.ActiveKeyChanged;
      break;

    case getType(sdkEvent.changedTab):
      eventType = CasperWalletEventType.TabChanged;
      break;

    case getType(sdkEvent.lockedEvent):
      eventType = CasperWalletEventType.Locked;
      break;

    case getType(sdkEvent.unlockedEvent):
      eventType = CasperWalletEventType.Unlocked;
      break;

    default:
      throw Error(
        'Content: emit sdk event unknown action: ' + JSON.stringify(message)
      );
  }

  const event = new CustomEvent(eventType, {
    detail: JSON.stringify(message.payload)
  });
  window.dispatchEvent(event);
}

// SDK Message proxy to the backend
function handleSdkRequestEvent(e: Event) {
  const requestAction = (e as CustomEvent).detail;
  // validation
  if (!isSDKMethod(requestAction)) {
    throw Error(
      'Content: invalid sdk requestAction: ' + JSON.stringify(requestAction)
    );
  }

  runtime
    .sendMessage(requestAction)
    .then(message => {
      // if valid message send back response
      if (isSDKMethod(message)) {
        window.dispatchEvent(
          new CustomEvent(SdkMethodEventType.Response, {
            detail: JSON.stringify(message)
          })
        );
      }
    })
    .catch(err => {
      throw Error('Content: sdk request received error: ' + err);
    });
}

// inject sdk script - idempotent, doesn't need cleanup
function injectSdkScript() {
  try {
    const documentHeadOrRoot = document.head || document.documentElement;
    const inpageScriptPath = 'sdk.bundle.js';

    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'text/javascript');
    scriptTag.src = runtime.getURL(inpageScriptPath);
    scriptTag.onload = function () {
      documentHeadOrRoot.removeChild(scriptTag);
    };
    documentHeadOrRoot.insertBefore(scriptTag, documentHeadOrRoot.children[0]);
  } catch (e) {
    console.error('CasperWalletSdk injection failed. ', e);
  }
}

function init() {
  // idempotent, doesn't need cleanup
  injectSdkScript();

  runtime.onMessage.addListener(handleSdkMessage);
  window.addEventListener(SdkMethodEventType.Request, handleSdkRequestEvent);
}

// cleanup logic
export const cleanupEventType = 'CasperWalletProvider:Cleanup';
window.dispatchEvent(new CustomEvent(cleanupEventType));
function cleanup() {
  document.removeEventListener(cleanupEventType, cleanup);

  runtime.onMessage.removeListener(handleSdkMessage);
  window.removeEventListener(SdkMethodEventType.Request, handleSdkRequestEvent);
}
window.addEventListener(cleanupEventType, cleanup);

init();

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
  darkTheme: {
    fontFamily: '"Inter", sans-serif',
    popupBg: '#18181F',
    // Primary button
    primaryBtnBg: '#C2000E',
    primaryBtnFC: '#FFFFFF',
    primaryBtnFW: '500',
    primaryBtnFS: '14px',
    primaryBtnBorderC: 'transparent',
    primaryBtnBorderW: '0',
    primaryBtnRadius: '4px',
    // Secondary button
    secondaryBtnBg: '#34363D',
    secondaryBtnFS: '14px',
    secondaryBtnFW: '500',
    secondaryBtnFC: '#7490FF',
    secondaryBtnBorderC: 'transparent',
    secondaryBtnBorderW: '0',
    secondaryBtnRadius: '4px',
    // Markdown
    markdownBg: '#262730',
    markdownFS: '13px',
    markdownFC: '#84868C',
    markdownBorderW: '0',
    markdownRadius: '4px',
    markdownBorderC: 'transparent',
    markdownScrollbarC: '#84868C',
    // Wallet address
    walletBg: '#262730',
    walletFS: '13px',
    walletFW: '400',
    walletFC: '#A9AAAD',
    walletBorderC: 'transparent',
    walletBorderW: '0',
    walletRadius: '4px',
    markdownTitleFS: '14px',
    markdownTitleFW: '700',
    markdownTitleFC: '#FFFFFF',
    // Details of offering
    detailsBg: '#262730',
    detailsTitleFS: '18px',
    detailsTitleFW: '700',
    detailsTitleFC: '#FFFFFF',
    detailsSubtitleFS: '14px',
    detailsSubtitleFW: '600',
    detailsSubtitleFC: '#A9AAAD',
    detailsRadius: '4px',
    detailsBorderW: '0',
    detailsBorderC: 'transparent',
    detailsAmountFC: '#7490FF',
    detailsAmountFW: '600',
    // Overlay
    overlayBg: '#18181FF2',
    overlayFS: '18px',
    overlayFW: '700',
    overlayFC: '#FFFFFF',
    loaderBg: '#C2000E',
    overlayWaitingBg: '#18181F',
    // Optout \ Turn off
    optoutBg: '#262730',
    optoutFS: '14px',
    optoutFW: '500',
    optoutFC: '#DADCE5',
    optoutRadius: '0',
    // X Button and close buttons
    closeFS: '14px',
    closeFW: '500',
    closeFC: '#7490FF',
    xBtnFC: '#A9AAAD',
    // Token name
    tokenBg: '#262730',
    tokenFS: '14px',
    tokenFW: '600',
    tokenFC: '#FFFFFF',
    tokenBorderW: '1px',
    tokenBorderC: '#FFFFFF',
    tokenRadius: '4px',
    // Notification popup
    notificationFS: '14px',
    notificationFW: '600',
    notificationFC: '#FFFFFF',
    notificationBtnBg: '#34363D',
    notificationBtnFS: '13px',
    notificationBtnFW: '500',
    notificationBtnFC: '#7490FF',
    notificationBtnBorderW: '0',
    notificationBtnBorderC: 'transparent',
    notificationBtnRadius: '4px',
    activateTitleFS: '14px',
    activateTitleFW: '600',
    activateTitleFC: '#A9AAAD',
    activateTitleBoldFS: '14px',
    activateTitleBoldFW: '600',
    activateTitleBoldFC: '#FFFFFF'
  },
  lightTheme: {
    fontFamily: '"Inter", sans-serif',
    popupBg: '#F5F6F7',
    // Primary button
    primaryBtnBg: '#CC000F',
    primaryBtnFC: '#FFFFFF',
    primaryBtnFW: '500',
    primaryBtnFS: '14px',
    primaryBtnBorderC: 'transparent',
    primaryBtnBorderW: '0',
    primaryBtnRadius: '4px',
    // Secondary button
    secondaryBtnBg: '#E6E8EA',
    secondaryBtnFS: '14px',
    secondaryBtnFW: '500',
    secondaryBtnFC: '#0A2EBF',
    secondaryBtnBorderC: 'transparent',
    secondaryBtnBorderW: '0',
    secondaryBtnRadius: '4px',
    // Markdown
    markdownBg: '#FFFFFF',
    markdownFS: '13px',
    markdownFC: '#84868C',
    markdownBorderW: '0',
    markdownRadius: '4px',
    markdownBorderC: 'transparent',
    markdownScrollbarC: '#84868C',
    markdownTitleFS: '14px',
    markdownTitleFW: '700',
    markdownTitleFC: '#1A1919',
    // Wallet address
    walletBg: '#FFFFFF',
    walletFS: '13px',
    walletFW: '400',
    walletFC: '#84868C',
    walletBorderC: 'transparent',
    walletBorderW: '0',
    walletRadius: '4px',
    // Details of offering
    detailsBg: '#FFFFFF',
    detailsTitleFS: '18px',
    detailsTitleFW: '700',
    detailsTitleFC: '#1A1919',
    detailsSubtitleFS: '14px',
    detailsSubtitleFW: '600',
    detailsSubtitleFC: '#84868C',
    detailsRadius: '4px',
    detailsBorderW: '0',
    detailsBorderC: 'transparent',
    detailsAmountFC: '#0A2EBF',
    detailsAmountFW: '600',
    // Overlay
    overlayBg: '#494B51F2',
    overlayFS: '18px',
    overlayFW: '700',
    overlayFC: '#1A1919',
    loaderBg: '#C2000E',
    overlayWaitingBg: '#F5F6F7',
    // Optout \ Turn off
    optoutBg: '#F5F6F7',
    optoutFS: '14px',
    optoutFW: '500',
    optoutFC: '#1A1919',
    optoutRadius: '0',
    // X Button and close buttons
    closeFS: '14px',
    closeFW: '500',
    closeFC: '#0A2EBF',
    xBtnFC: '#84868C',
    // Token name
    tokenBg: '#FFFFFF',
    tokenFS: '14px',
    tokenFW: '600',
    tokenFC: '#1A1919',
    tokenBorderW: '1px',
    tokenBorderC: '#1A1919',
    tokenRadius: '4px',
    // Notification popup
    notificationFS: '14px',
    notificationFW: '600',
    notificationFC: '#1A1919',
    notificationBtnBg: '#E6E8EA',
    notificationBtnFS: '13px',
    notificationBtnFW: '500',
    notificationBtnFC: '#0A2EBF',
    notificationBtnBorderW: '0',
    notificationBtnBorderC: 'transparent',
    notificationBtnRadius: '4px',
    activateTitleFS: '14px',
    activateTitleFW: '600',
    activateTitleFC: '#84868C',
    activateTitleBoldFS: '14px',
    activateTitleBoldFW: '600',
    activateTitleBoldFC: '#1A1919'
  }
});
