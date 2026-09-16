import { alarms, runtime } from 'webextension-polyfill';

import { isChromeBuild } from '@src/utils';

import { getExistingMainStoreSingletonOrInit } from '@background/redux/get-main-store';
import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import { selectVaultCipherDoesExist } from '@background/redux/vault-cipher/selectors';

const KEEP_ALIVE_ALARM_NAME = 'casper-keep-alive';

// Registered synchronously at module load so it survives every MV3 cold start.
// Gated: only the Chrome manifest declares `alarms`, elsewhere it is undefined.
if (isChromeBuild) {
  alarms.onAlarm.addListener(alarm => {
    if (alarm.name === KEEP_ALIVE_ALARM_NAME) {
      keepAlive();
    }
  });
}

// Edge-triggered so store updates cannot reset the alarm's schedule; `null`
// means "unknown" on a fresh SW start, where a persisted alarm may survive.
let alarmActive: boolean | null = null;

export function startKeepAlive() {
  if (alarmActive === true) {
    return;
  }
  // 0.5 min is the alarms-API minimum only on Chrome >= 120, which the manifest
  // pins: a clamped 60s pulse loses the worker at its ~30s idle deadline.
  alarms.create(KEEP_ALIVE_ALARM_NAME, { periodInMinutes: 0.5 });
  alarmActive = true;
  console.log('KeepAlive alarm started.');
}

export function stopKeepAlive() {
  if (alarmActive === false) {
    return;
  }
  alarms.clear(KEEP_ALIVE_ALARM_NAME);
  alarmActive = false;
  console.log('KeepAlive alarm stopped.');
}

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
    // With no popup or tab open the ping has no receiver, which is the normal
    // idle state; matched on text because a polyfill may reject with a string.
    const text = error instanceof Error ? error.message : String(error);
    if (text.includes('Receiving end does not exist')) {
      return;
    }
    console.error('KeepAlive error:', error);
  });
}

export async function initKeepAlive() {
  if (isChromeBuild) {
    const store = await getExistingMainStoreSingletonOrInit();

    await manageKeepAlive();

    store.subscribe(async () => {
      await manageKeepAlive();
    });
  }
}
