// TODO: No best place for `createOpenWindow` function. Need to move to most appropriate place
import Browser from 'webextension-polyfill';

export enum PurposeForOpening {
  ImportAccount = 'ImportAccount',
  ConnectToApp = 'ConnectToApp'
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
      const allWindows = await Browser.windows.getAll();
      const isWindowExists = allWindows.find(window => window.id === id);

      if (isWindowExists) {
        const window = await Browser.windows.get(id);
        if (window.id) {
          await Browser.windows.update(window.id, {
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
      Browser.windows
        .getCurrent()
        .then(window => {
          const windowWidth = window.width ?? 0;
          const xOffset = window.left ?? 0;
          const yOffset = window.top ?? 0;
          const popupWidth = 360;
          const popupHeight =
            purposeForOpening === PurposeForOpening.ConnectToApp ? 700 : 600;

          Browser.windows
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
                  Browser.windows.onRemoved.removeListener(handleCloseWindow);
                  clearWindowId();
                };
                Browser.windows.onRemoved.addListener(handleCloseWindow);
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
