// TODO: No best place for `createOpenWindow` function. Need to move to most appropriate place
import browser from 'webextension-polyfill';

export enum PurposeForOpening {
  ImportAccount = 'ImportAccount',
  ConnectToApp = 'ConnectToApp'
}

function getUrlByPurposeForOpening(
  purposeForOpening: PurposeForOpening,
  origin?: string
) {
  // `width` and `height` params needs for resize window for Windows OS
  // Window size on Windows less a little than I set to it:
  // `width` less on 13px and `height` less on 35px
  switch (purposeForOpening) {
    case PurposeForOpening.ImportAccount:
      return 'import-account-with-file.html?width=373&height=635';
    case PurposeForOpening.ConnectToApp:
      return `connect-to-app.html?origin=${origin}&width=373&height=735`;
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
        await openWindow({ purposeForOpening, isNewWindow: true, origin });
      }
    } else {
      browser.windows
        .getCurrent()
        .then(window => {
          const windowWidth = window.width ?? 0;
          const xOffset = window.left ?? 0;
          const yOffset = window.top ?? 0;
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
            .then(newPopup => {
              if (newPopup.id) {
                setWindowId(newPopup.id);

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
