import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Browser from 'webextension-polyfill';

import { selectWindowId } from '@popup/redux/vault/selectors';
import { clearWindowId, saveWindowId } from '@popup/redux/vault/actions';

export enum PurposeForOpening {
  ImportAccount = 'ImportAccount'
}

export function useWindowManager() {
  const dispatch = useDispatch();
  const windowId = useSelector(selectWindowId);

  const handleCloseWindow = useCallback(() => {
    dispatch(clearWindowId());
  }, [dispatch]);

  useEffect(() => {
    Browser.windows.onRemoved.addListener(handleCloseWindow);

    return () => {
      Browser.windows.onRemoved.removeListener(handleCloseWindow);
    };
  }, [windowId, dispatch, handleCloseWindow]);

  async function open(
    purposeForOpening: PurposeForOpening,
    isNewWindow?: boolean
  ) {
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
        dispatch(clearWindowId());
        await open(purposeForOpening, true);
      }
    } else {
      Browser.windows
        .getCurrent()
        .then(window => {
          const windowWidth = window.width ?? 0;
          const xOffset = window.left ?? 0;
          const yOffset = window.top ?? 0;
          const popupWidth = 360;
          const popupHeight = 600;

          Browser.windows
            .create({
              url:
                purposeForOpening === PurposeForOpening.ImportAccount
                  ? 'import-account-with-file.html'
                  : 'popup.html?#/',
              type: 'popup',
              height: popupHeight,
              width: popupWidth,
              left: windowWidth + xOffset - popupWidth,
              top: yOffset
            })
            .then(newPopup => {
              if (newPopup.id) {
                dispatch(saveWindowId(newPopup.id));
              }
            });
        })
        .catch(e => {
          // TODO: handle errors
          console.log(e);
        });
    }
  }

  async function close() {
    try {
      if (windowId) {
        await Browser.windows.remove(windowId);
      } else {
        // This allows the FE to call close popup without querying for window id to pass.
        const currentWindow = await Browser.windows.getCurrent();
        if (currentWindow.type === 'popup' && currentWindow.id) {
          await Browser.windows.remove(currentWindow.id);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  const openWindow = useCallback(open, [dispatch, open, windowId]);
  const closeWindow = useCallback(close, [windowId]);

  return { openWindow, closeWindow };
}
