import { tabs } from 'webextension-polyfill';

import { SdkMethod } from '@content/sdk-method';

export async function sendSdkResponseToSpecificTab(
  action: SdkMethod,
  tabId: number
) {
  if (!Number.isInteger(tabId) || tabId < 0) {
    console.error('sendSdkResponseToSpecificTab: invalid tabId', tabId);
    return;
  }

  try {
    await tabs.sendMessage(tabId, action);
  } catch (err) {
    console.warn('sendSdkResponseToSpecificTab: delivery failed', err);
  }
}

export function parseRequestTabId(
  searchParams: URLSearchParams
): number | null {
  const raw = searchParams.get('tabId');

  if (!raw) return null;

  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}
