import browser from 'webextension-polyfill';

export enum PurposeForOpening {
  ImportAccount = 'ImportAccount',
  ConnectToApp = 'ConnectToApp',
  SignatureRequest = 'SignatureRequest'
}

export type WindowSearchParams = Record<string, string>;

function getUrlByPurposeForOpening(
  purposeForOpening: PurposeForOpening,
  searchParams?: WindowSearchParams
) {
  const urlSearchParams = new URLSearchParams(searchParams).toString();
  const searchParamsWithPrefix = urlSearchParams && '?' + urlSearchParams;

  switch (purposeForOpening) {
    case PurposeForOpening.ImportAccount:
      return 'import-account-with-file.html' + searchParamsWithPrefix;
    case PurposeForOpening.ConnectToApp:
      return `connect-to-app.html` + searchParamsWithPrefix;
    case PurposeForOpening.SignatureRequest:
      return 'signature-request.html' + searchParamsWithPrefix;
    default:
      return 'popup.html?#/';
  }
}

interface CreateOpenWindowProps {
  windowId: number | null;
  clearWindowId: () => void;
  setWindowId: (id: number) => void;
}

export interface OpenWindowProps {
  purposeForOpening: PurposeForOpening;
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
    purposeForOpening,
    isNewWindow,
    searchParams
  }: OpenWindowProps): Promise<browser.Windows.Window> {
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
              url: getUrlByPurposeForOpening(purposeForOpening, searchParams)
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

        return browser.windows
          .create({
            url: getUrlByPurposeForOpening(purposeForOpening, searchParams),
            type: 'popup',
            height: popupHeight,
            width: popupWidth,
            left: windowWidth + xOffset - popupWidth,
            top: yOffset
          })
          .then(newWindow => {
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
