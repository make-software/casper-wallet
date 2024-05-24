import { Windows, tabs, windows } from 'webextension-polyfill';

import { RouterPath } from '@signature-request/router';

export enum WindowApp {
  ImportAccount = 'ImportAccount',
  ConnectToApp = 'ConnectToApp',
  SwitchAccount = 'SwitchAccount',
  SignatureRequestDeploy = 'SignatureRequestDeploy',
  SignatureRequestMessage = 'SignatureRequestMessage'
}

export type WindowSearchParams = Record<string, string>;

function getUrlByWindowApp(
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
    default:
      return 'popup.html';
  }
}

interface CreateOpenWindowProps {
  windowId: number | null;
  clearWindowId: () => void;
  setWindowId: (id: number) => void;
}

export interface OpenWindowProps {
  windowApp: WindowApp;
  isNewWindow?: boolean;
  searchParams?: WindowSearchParams;
}

// This function returns a window instance that was created or reused
export function createOpenWindow({
  windowId,
  setWindowId,
  clearWindowId
}: CreateOpenWindowProps) {
  return async function openWindow({
    windowApp,
    isNewWindow,
    searchParams
  }: OpenWindowProps): Promise<Windows.Window> {
    const id = isNewWindow ? null : windowId;

    if (id != null) {
      const window = await reuseExistingWindow(id);
      if (window != null) {
        return window;
      }
    }

    return openNewWindow();

    // helpers

    async function reuseExistingWindow(
      id: number
    ): Promise<Windows.Window | undefined> {
      const allWindows = await windows.getAll();
      const existingWindow = allWindows.find(window => window.id === id);

      if (existingWindow) {
        const window = await windows.get(id, { populate: true });
        if (window?.id != null) {
          // Bring popup window to the front
          await windows.update(window.id, {
            focused: true,
            drawAttention: true
          });
          // update tab url
          const tab = window.tabs?.[0];
          if (tab?.id != null) {
            await tabs.update({
              url: getUrlByWindowApp(windowApp, searchParams)
            });
          }
          return window;
        }
      } else {
        clearWindowId();
      }
    }

    async function openNewWindow(): Promise<Windows.Window> {
      return windows.getCurrent().then(async currentWindow => {
        // If this flag is true, we create a new window without any size and positions.
        const isTestEnv = Boolean(process.env.TEST_ENV);

        const windowWidth = currentWindow.width ?? 0;
        const xOffset = currentWindow.left ?? 0;
        const yOffset = currentWindow.top ?? 0;
        const crossPlatformWidthOffset = 16;
        const popupWidth = 360 + crossPlatformWidthOffset;
        const popupHeight = 700;
        const newWindow =
          // We need this check for Firefox. If the Firefox browser is in fullscreen mode it ignores the width and height that we set and opens a popup in a small size.
          // So we check it and if it is in a fullscreen mode we didn't set width and height, and the popup will also open in fullscreen mode.
          // This is a default behavior for Safari and Chrome, but Firefox doesn't do this, so we need to do this manually for it.
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
          if (newWindow.id) {
            setWindowId(newWindow.id);

            const handleCloseWindow = () => {
              windows.onRemoved.removeListener(handleCloseWindow);
              clearWindowId();
            };
            windows.onRemoved.addListener(handleCloseWindow);
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

  // If this flag is true, we create a new window without any size and positions.
  const isTestEnv = Boolean(process.env.TEST_ENV);

  const windowWidth = currentWindow.width ?? 0;
  const xOffset = currentWindow.left ?? 0;
  const yOffset = currentWindow.top ?? 0;
  const crossPlatformWidthOffset = 16;
  const popupWidth = 360 + crossPlatformWidthOffset;
  const popupHeight = 800;
  const newWindow =
    // We need this check for Firefox. If the Firefox browser is in fullscreen mode it ignores the width and height that we set and opens a popup in a small size.
    // So we check it and if it is in a fullscreen mode we didn't set width and height, and the popup will also open in fullscreen mode.
    // This is a default behavior for Safari and Chrome, but Firefox doesn't do this, so we need to do this manually for it.
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
          left: windowWidth + xOffset - popupWidth,
          top: yOffset,
          focused: true
        });

  return newWindow;
}
