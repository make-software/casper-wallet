import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Browser from 'webextension-polyfill';

import { selectWindowId } from '@popup/redux/windowManagement/selectors';
import {
  clearWindowId,
  storeWindowId
} from '@popup/redux/windowManagement/actions';

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
                dispatch(storeWindowId(newPopup.id));
              }
            });
        })
        .catch(e => {
          // TODO: handle errors
          console.error(e);
        });
    }
  }

  const openWindow = useCallback(open, [dispatch, open, windowId]);

  return { openWindow };
}
