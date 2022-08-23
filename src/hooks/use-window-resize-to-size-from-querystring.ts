import { useEffect } from 'react';
import browser from 'webextension-polyfill';

export function useWindowResizeToSizeFromQuerystring() {
  useEffect(() => {
    const isWindows = navigator.userAgent.includes('Windows');

    const querystring = new URLSearchParams(document.location.search);
    const width = querystring.get('width');
    const height = querystring.get('height');

    if (isWindows && width != null && height != null) {
      const widthPx = Number.parseInt(width);
      const heightPx = Number.parseInt(height);

      if (!Number.isNaN(widthPx) && !Number.isNaN(heightPx)) {
        setTimeout(() => {
          browser.windows
            .update(browser.windows.WINDOW_ID_CURRENT, {
              width: widthPx,
              height: heightPx
            })
            .catch(e => {
              throw new Error(e);
            });
        }, 250);
      }
    }
  }, []);
}
