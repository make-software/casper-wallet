import { Driver } from '../webdriver/driver';
import { E2EEventParams } from '../types';

import { E2ESetToPopupState } from '../../src/background/redux/e2e/actions';
import Browser from 'webextension-polyfill';

export async function sendE2EEvent(
  driver: Driver,
  { type, payload }: E2EEventParams
) {
  await driver.executeScript(
    `
          const event = new CustomEvent('E2E:event', {
            detail: JSON.stringify({
              type: arguments[0][0],
              payload: arguments[0][1]
            })
          });
          
          window.dispatchEvent(event);
        `,
    type,
    payload
  );
}

export function handleE2EEvents(browser: typeof Browser) {
  window.addEventListener('E2E:event', e => {
    const action: E2EEventParams = JSON.parse((e as CustomEvent).detail);

    switch (action.type) {
      case 'set-to-popup-state':
        browser.runtime.sendMessage(E2ESetToPopupState(action.payload));

        break;
      default:
        throw new Error('Unknown action type');
    }
  });
}
