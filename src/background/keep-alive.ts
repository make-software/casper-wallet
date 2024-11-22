import { runtime } from 'webextension-polyfill';

import { getExistingMainStoreSingletonOrInit } from '@background/redux/get-main-store';
import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import { selectVaultCipherDoesExist } from '@background/redux/vault-cipher/selectors';

let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

// Function to start the keep-alive interval
export function startKeepAlive() {
  if (!keepAliveInterval) {
    keepAliveInterval = setInterval(keepAlive, 15000); // 15 seconds
    console.log('KeepAlive interval started.');
  }
}

// Function to stop the keep-alive interval
export function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('KeepAlive interval stopped.');
  }
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
  runtime.sendMessage('keepAlive').catch(error => {
    console.error('KeepAlive error:', error);
  });
}

export async function initKeepAlive() {
  const store = await getExistingMainStoreSingletonOrInit();

  // Initial call to manageKeepAlive to set the initial state
  await manageKeepAlive();

  // Subscribe to store updates
  store.subscribe(async () => {
    await manageKeepAlive();
  });
}
