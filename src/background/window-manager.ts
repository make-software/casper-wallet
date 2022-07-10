import Browser from 'webextension-polyfill';
import { PurposeForOpening } from '@src/hooks';

let windowId: number | null = null;

function getUrlByPurposeForOpening(purposeForOpening: PurposeForOpening) {
  switch (purposeForOpening) {
    case PurposeForOpening.ConnectToApp:
      return `connect-to-app.html?origin=${origin}`;
    default:
      throw new Error('Unknown purpose for opening');
  }
}

export async function openWindow(
  purposeForOpening: PurposeForOpening,
  origin: string
) {
  if (windowId) {
    const window = await Browser.windows.get(windowId);

    if (window && window.id) {
      await Browser.windows.update(window.id, {
        focused: true,
        drawAttention: true
      });
    }
    return;
  }

  const window = await Browser.windows.getCurrent();

  const popupWidth = 360;
  const popupHeight = 600;
  const windowWidth = window.width ?? 0;
  const xOffset = 100;
  const yOffset = 100;
  const url = getUrlByPurposeForOpening(purposeForOpening);

  await Browser.windows
    .create({
      type: 'popup',
      height: popupHeight,
      width: popupWidth,
      left: windowWidth - popupWidth - xOffset,
      top: yOffset,
      url
    })
    .then(newWindow => {
      if (newWindow.id) {
        windowId = newWindow.id;
      }

      Browser.windows.onRemoved.addListener(() => {
        windowId = null;
      });
    });
}
