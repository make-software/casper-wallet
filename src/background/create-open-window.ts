import { Windows, tabs, windows } from 'webextension-polyfill';

import { RouterPath } from '@signature-request/router';

export enum WindowApp {
  ImportAccount = 'ImportAccount',
  ConnectToApp = 'ConnectToApp',
  SwitchAccount = 'SwitchAccount',
  SignatureRequestDeploy = 'SignatureRequestDeploy',
  SignatureRequestMessage = 'SignatureRequestMessage',
  SignatureRequestEip712 = 'SignatureRequestEip712',
  DecryptMessageRequest = 'DecryptMessageRequest'
}

export type WindowSearchParams = Record<string, string>;

export function getUrlByWindowApp(
  windowApp: WindowApp,
  searchParams?: WindowSearchParams
) {
  const urlSearchParams = new URLSearchParams(searchParams).toString();
  const searchParamsWithPrefix = urlSearchParams && '?' + urlSearchParams;

  switch (windowApp) {
    case WindowApp.ImportAccount:
      return `import-account-with-file.html${searchParamsWithPrefix}`;
    case WindowApp.ConnectToApp:
      return `connect-to-app.html${searchParamsWithPrefix}`;
    case WindowApp.SwitchAccount:
      return (
        `connect-to-app.html?switchAccount=true` +
        (urlSearchParams && '&' + urlSearchParams)
      );
    case WindowApp.SignatureRequestDeploy:
      return `signature-request.html${searchParamsWithPrefix}#${RouterPath.SignDeploy}`;
    case WindowApp.SignatureRequestMessage:
      return `signature-request.html${searchParamsWithPrefix}#${RouterPath.SignMessage}`;
    case WindowApp.SignatureRequestEip712:
      return `signature-request.html${searchParamsWithPrefix}#${RouterPath.SignEip712}`;
    case WindowApp.DecryptMessageRequest:
      return `signature-request.html${searchParamsWithPrefix}#${RouterPath.DecryptMessage}`;
    default:
      return 'popup.html';
  }
}

// Optional here rather than no-op'd at the call site, so a UI caller cannot
// accidentally retarget the shared approval slot.
interface CreateOpenWindowProps {
  windowId?: number | null;
  clearWindowId?: () => void;
  setWindowId?: (id: number) => void;
}

export interface OpenWindowProps {
  windowApp: WindowApp;
  isNewWindow?: boolean;
  searchParams?: WindowSearchParams;
}

export function createOpenWindow({
  windowId = null,
  setWindowId,
  clearWindowId
}: CreateOpenWindowProps = {}) {
  return async function openWindow({
    windowApp,
    isNewWindow,
    searchParams
  }: OpenWindowProps): Promise<{ window: Windows.Window; reused: boolean }> {
    const id = isNewWindow ? null : windowId;

    if (id != null) {
      const window = await reuseExistingWindow(id);
      if (window != null) {
        return { window, reused: true };
      }
    }

    return { window: await openNewWindow(), reused: false };

    async function reuseExistingWindow(
      id: number
    ): Promise<Windows.Window | undefined> {
      const allWindows = await windows.getAll();
      const existingWindow = allWindows.find(window => window.id === id);

      if (existingWindow) {
        const window = await windows.get(id, { populate: true });
        if (window?.id != null) {
          await windows.update(window.id, {
            focused: true,
            drawAttention: true
          });
          const tab = window.tabs?.[0];
          if (tab?.id != null) {
            await tabs.update(tab.id, {
              url: getUrlByWindowApp(windowApp, searchParams)
            });
          }
          return window;
        }
      } else {
        clearWindowId?.();
      }
    }

    async function openNewWindow(): Promise<Windows.Window> {
      return windows.getCurrent().then(async currentWindow => {
        const isTestEnv = Boolean(process.env.TEST_ENV);

        const windowWidth = currentWindow.width ?? 0;
        const xOffset = currentWindow.left ?? 0;
        const yOffset = currentWindow.top ?? 0;
        const crossPlatformWidthOffset = 16;
        const popupWidth = 360 + crossPlatformWidthOffset;
        const popupHeight = 700;
        const newWindow =
          // Firefox in fullscreen ignores the width and height we set and opens a
          // small popup, so we omit them and let it open fullscreen as well.
          currentWindow.state === 'fullscreen' || isTestEnv
            ? windows.create({
                url: getUrlByWindowApp(windowApp, searchParams),
                type: 'popup',
                focused: true
              })
            : windows.create({
                url: getUrlByWindowApp(windowApp, searchParams),
                type: 'popup',
                height: popupHeight,
                width: popupWidth,
                left: windowWidth + xOffset - popupWidth,
                top: yOffset,
                focused: true
              });

        return newWindow.then(newWindow => {
          // `isNewWindow` opens a deliberately SEPARATE window; tracking it would
          // retarget the shared approval slot to the wrong window's close event.
          if (newWindow.id && !isNewWindow) {
            setWindowId?.(newWindow.id);
          }
          return newWindow;
        });
      });
    }
  };
}

export interface IOpenNewSeparateWindowParams {
  url: string;
}

export async function openNewSeparateWindow({
  url
}: IOpenNewSeparateWindowParams): Promise<Windows.Window> {
  const currentWindow = await windows.getCurrent();

  const isTestEnv = Boolean(process.env.TEST_ENV);

  const windowWidth = currentWindow.width ?? 0;
  const xOffset = currentWindow.left ?? 0;
  const yOffset = currentWindow.top ?? 0;
  const crossPlatformWidthOffset = 16;
  const popupWidth = 360 + crossPlatformWidthOffset;
  const popupHeight = 800;
  const newWindow =
    // Firefox in fullscreen ignores the width and height we set and opens a
    // small popup, so we omit them and let it open fullscreen as well.
    currentWindow.state === 'fullscreen' || isTestEnv
      ? await windows.create({
          url,
          type: 'normal',
          focused: true
        })
      : await windows.create({
          url,
          type: 'normal',
          height: popupHeight,
          width: popupWidth,
          left: windowWidth + xOffset - popupWidth - 200,
          top: yOffset,
          focused: true
        });

  return newWindow;
}
