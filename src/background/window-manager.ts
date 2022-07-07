import Browser from 'webextension-polyfill';
import { PurposeForOpening } from '@src/hooks';

let windowId: number | null = null;

export async function openWindow(purposeForOpening: PurposeForOpening) {
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

  const popupWidth = 360;
  const popupHeight = 600;
  let url: string;

  switch (purposeForOpening) {
    case PurposeForOpening.ConnectToApp:
      url = 'connect-to-app.html';
      break;
    default:
      throw new Error('Unknown purpose for opening');
  }

  await Browser.windows
    .create({
      type: 'popup',
      height: popupHeight,
      width: popupWidth,
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
