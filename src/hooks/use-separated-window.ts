import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { browser } from 'webextension-polyfill-ts';

import { selectWindowId } from '@libs/redux/vault/selectors';
import { clearWindowId, saveWindowId } from '@libs/redux/vault/actions';

export enum PurposeForOpening {
  ImportAccount = 'ImportAccount'
}

export function useSeparatedWindow() {
  const dispatch = useDispatch();
  const windowId = useSelector(selectWindowId);

  const handleCloseWindow = useCallback(() => {
    dispatch(clearWindowId());
  }, [dispatch]);

  useEffect(() => {
    browser.windows.onRemoved.addListener(handleCloseWindow);

    return () => {
      browser.windows.onRemoved.removeListener(handleCloseWindow);
    };
  }, [windowId, dispatch, handleCloseWindow]);

  async function open(
    purposeForOpening: PurposeForOpening,
    isNewWindow?: boolean
  ) {
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
        dispatch(clearWindowId());
        await open(purposeForOpening, true);
      }
    } else {
      browser.windows
        .getCurrent()
        .then(window => {
          const windowWidth = window.width ?? 0;
          const xOffset = window.left ?? 0;
          const yOffset = window.top ?? 0;
          const popupWidth = 360;
          const popupHeight = 600;

          browser.windows
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
        await browser.windows.remove(windowId);
      } else {
        // This allows the FE to call close popup without querying for window id to pass.
        const currentWindow = await browser.windows.getCurrent();
        if (currentWindow.type === 'popup' && currentWindow.id) {
          await browser.windows.remove(currentWindow.id);
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
