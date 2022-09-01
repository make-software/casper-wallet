import browser from 'webextension-polyfill';

export enum PurposeForOpening {
  ImportAccount = 'ImportAccount',
  ConnectToApp = 'ConnectToApp',
  SigningRequest = 'SigningRequest'
}

function getUrlByPurposeForOpening(
  purposeForOpening: PurposeForOpening,
  origin?: string
) {
  switch (purposeForOpening) {
    case PurposeForOpening.ImportAccount:
      return 'import-account-with-file.html';
    case PurposeForOpening.ConnectToApp:
      return `connect-to-app.html?origin=${origin}`;
    case PurposeForOpening.SigningRequest:
      return 'signing-request.html';
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
  origin?: string;
}
// TODO: This function should return created window instance
// background should manage the windows using request messages received from popup/content
export function createOpenWindow({
  windowId,
  setWindowId,
  clearWindowId
}: CreateOpenWindowProps) {
  return async function openWindow({
    purposeForOpening,
    isNewWindow,
    origin
  }: OpenWindowProps) {
    const id = isNewWindow ? null : windowId;

    if (id) {
      const allWindows = await browser.windows.getAll();
      const isWindowExists = allWindows.find(window => window.id === id);

      if (isWindowExists) {
        const window = await browser.windows.get(id);
        if (window.id) {
          await browser.windows.update(window.id, {
            // Bring popup window to the front
            focused: true,
            drawAttention: true
          });
        }
      } else {
        clearWindowId();
        // TODO: why this is calling recursively? this logic should be simplified
        await openWindow({ purposeForOpening, isNewWindow: true, origin });
      }
    } else {
      browser.windows
        .getCurrent()
        .then(currentWindow => {
          const windowWidth = currentWindow.width ?? 0;
          const xOffset = currentWindow.left ?? 0;
          const yOffset = currentWindow.top ?? 0;
          const popupWidth = 360;
          const popupHeight =
            purposeForOpening === PurposeForOpening.ConnectToApp ? 700 : 600;

          browser.windows
            .create({
              url: getUrlByPurposeForOpening(purposeForOpening, origin),
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
            });
        })
        .catch(e => {
          // TODO: handle errors
          console.error(e);
        });
    }
  };
}
