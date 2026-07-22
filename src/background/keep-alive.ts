import { alarms, runtime } from 'webextension-polyfill';

import { isChromeBuild } from '@src/utils';

import { getExistingMainStoreSingletonOrInit } from '@background/redux/get-main-store';
import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import { selectVaultCipherDoesExist } from '@background/redux/vault-cipher/selectors';

const KEEP_ALIVE_ALARM_NAME = 'casper-keep-alive';

// chrome.alarms.onAlarm must be registered synchronously at module load so it
// re-registers on every service worker cold start (MV3 requirement). The
// isChromeBuild gate is load-bearing: only the Chrome (MV3) manifest declares
// the `alarms` permission, so on Firefox/Safari the polyfill exposes no
// `alarms` namespace and an ungated registration would crash the background
// entry at load.
if (isChromeBuild) {
  alarms.onAlarm.addListener(alarm => {
    if (alarm.name === KEEP_ALIVE_ALARM_NAME) {
      keepAlive();
    }
  });
}

// Edge-triggered guard: manageKeepAlive runs on every store update, and an
// unguarded alarms.create would reset the alarm's schedule on each dispatch,
// pushing the next fire to ~30s after the last update — exactly Chrome's idle
// deadline. `null` means "unknown" (fresh SW start): alarms persist across SW
// restarts, so the first start/stop call must always reach the alarms API —
// create refreshes the surviving alarm, clear kills a stale one.
let alarmActive: boolean | null = null;

// Function to start the keep-alive alarm
export function startKeepAlive() {
  if (alarmActive === true) {
    return;
  }
  // 0.5 min is the alarms-API minimum only on Chrome >= 120; older Chromes
  // silently clamp sub-minute periods to 1 minute, and a 60s pulse loses the
  // service worker at its ~30s idle deadline (silent session loss). The
  // manifest pins `minimum_chrome_version: 120` for exactly this reason.
  alarms.create(KEEP_ALIVE_ALARM_NAME, { periodInMinutes: 0.5 });
  alarmActive = true;
  console.log('KeepAlive alarm started.');
}

// Function to stop the keep-alive alarm
export function stopKeepAlive() {
  if (alarmActive === false) {
    return;
  }
  alarms.clear(KEEP_ALIVE_ALARM_NAME);
  alarmActive = false;
  console.log('KeepAlive alarm stopped.');
}

// Function to check and manage the keep-alive mechanism based on vault state
async function manageKeepAlive() {
  const store = await getExistingMainStoreSingletonOrInit();
  const state = store.getState();

  const vaultIsLocked = selectVaultIsLocked(state);
  const keysDoesExist = selectKeysDoesExist(state);
  const vaultCipherDoesExist = selectVaultCipherDoesExist(state);

  if (vaultIsLocked && keysDoesExist && vaultCipherDoesExist) {
    stopKeepAlive();
  } else {
    startKeepAlive();
  }
}

// ping mechanism to keep background script from destroing wallet session when it's unlocked
function keepAlive() {
  runtime.sendMessage('keepAlive').catch((error: unknown) => {
    // `runtime.sendMessage` delivers to every extension context except the
    // sender, so when no popup/tab is open the ping has no receiver and Chrome
    // rejects with "Receiving end does not exist." That is expected and
    // harmless — the act of sending is what resets the SW idle timer; the
    // reply is unused. Swallow only this case so real errors still surface.
    if (
      error instanceof Error &&
      error.message.includes('Receiving end does not exist')
    ) {
      return;
    }
    console.error('KeepAlive error:', error);
  });
}

export async function initKeepAlive() {
  if (isChromeBuild) {
    const store = await getExistingMainStoreSingletonOrInit();

    // Initial call to manageKeepAlive to set the initial state
    await manageKeepAlive();

    // Subscribe to store updates
    store.subscribe(async () => {
      await manageKeepAlive();
    });
  }
}
