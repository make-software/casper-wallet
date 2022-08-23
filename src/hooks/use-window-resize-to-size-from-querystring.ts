import { useEffect } from 'react';
import BrowserDetector from 'browser-dtector';
import browser from 'webextension-polyfill';

// `width` and `height` params needs for resize window for Windows OS
// Window size on Windows less a little than I set to it:
// `width` less on 13px and `height` less on 35px for Chrome
// and
// `width` less on 13px and `height` less on 36.5px (cell to 37, `windows.update` requires an integer) for Firefox
const platformToWindowSizeOffsets = {
  windows: {
    chrome: { width: 13, height: 35 },
    firefox: { width: 13, height: 37 }
  },
  mac: {
    chrome: { width: 0, height: 28 },
    firefox: { width: 0, height: 29 }
  }
};

function getWindowSizes() {
  const browserDetector = new BrowserDetector(navigator.userAgent);
  const browserInfo = browserDetector.getBrowserInfo();

  const querystring = new URLSearchParams(document.location.search);
  const width = querystring.get('width');
  const height = querystring.get('height');

  if (width == null || height == null) {
    return null;
  }

  const widthPx = Number.parseInt(width);
  const heightPx = Number.parseInt(height);

  if (Number.isNaN(widthPx) || Number.isNaN(heightPx)) {
    return null;
  }

  // We need only Mac and Windows. Linux has no big difference (only FF window height less on 1px, not critical)
  const osKey = browserInfo.platform === 'Windows' ? 'windows' : 'mac';
  // `Chrome` browser used by default because there are a lot of browsers built on `Chrome` engine (Brave, Opera for example)
  const browserKey =
    browserInfo.name === 'Mozilla Firefox' ? 'firefox' : 'chrome';

  return {
    width: widthPx + platformToWindowSizeOffsets[osKey][browserKey].width,
    height: heightPx + platformToWindowSizeOffsets[osKey][browserKey].height
  };
}

export function useWindowResizeToSizeFromQuerystring() {
  useEffect(() => {
    const windowSizes = getWindowSizes();

    if (windowSizes != null) {
      setTimeout(() => {
        browser.windows
          .update(browser.windows.WINDOW_ID_CURRENT, windowSizes)
          .catch(e => {
            throw new Error(e);
          });
      }, 250);
    }
  }, []);
}
