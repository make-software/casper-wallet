import { RouterPath } from '@src/apps/signature-request/router';
import browser from 'webextension-polyfill';

export enum WindowApp {
  ImportAccount = 'ImportAccount',
  ConnectToApp = 'ConnectToApp',
  SwitchAccount = 'SwitchAccount',
  SignatureRequestDeploy = 'SignatureRequestDeploy',
  SignatureRequestMessage = 'SignatureRequestMessage'
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
  }: OpenWindowProps): Promise<browser.Windows.Window> {
    const id = isNewWindow ? null : windowId;
    console.log(id, 'id');
    if (id != null) {
      const window = await reuseExistingWindow(id);
      console.log(window, 'window');
      if (window != null) {
        return window;
      }
    }
    console.log(await openNewWindow());
    return openNewWindow();

    // helpers

    async function reuseExistingWindow(
      id: number
    ): Promise<browser.Windows.Window | undefined> {
      const allWindows = await browser.windows.getAll();
      const existingWindow = allWindows.find(window => window.id === id);

      if (existingWindow) {
        const window = await browser.windows.get(id, { populate: true });
        if (window?.id != null) {
          // Bring popup window to the front
          await browser.windows.update(window.id, {
            focused: true,
            drawAttention: true
          });
          // update tab url
          const tab = window.tabs?.[0];
          if (tab?.id != null) {
            await browser.tabs.update({
              url: getUrlByWindowApp(windowApp, searchParams)
            });
          }
          return window;
        }
      } else {
        clearWindowId();
      }
    }

    async function openNewWindow(): Promise<browser.Windows.Window> {
      return browser.windows.getCurrent().then(currentWindow => {
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
          currentWindow.state === 'fullscreen'
            ? browser.windows.create({
                url: getUrlByWindowApp(windowApp, searchParams),
                type: 'popup',
                focused: true
              })
            : browser.windows.create({
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
              browser.windows.onRemoved.removeListener(handleCloseWindow);
              clearWindowId();
            };
            browser.windows.onRemoved.addListener(handleCloseWindow);
          }
          return newWindow;
        });
      });
    }
  };
}
