import { useEffect } from 'react';

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
        setTimeout(() => window.resizeTo(widthPx, heightPx), 250);
      }
    }
  }, []);
}
