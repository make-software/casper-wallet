import browser from 'webextension-polyfill';

const storageKey = 'onboarding_tab_state';

type OnboardingFlowState = { tabId: number; windowId: number };

export async function disableOnboardingFlow() {
  browser.action?.setPopup && browser.action.setPopup({ popup: 'popup.html' });
  browser.browserAction?.setPopup &&
    browser.browserAction.setPopup({ popup: 'popup.html' });
  browser.storage.local.remove(storageKey);
}

export async function enableOnboardingFlow() {
  browser.action?.setPopup && browser.action.setPopup({ popup: '' });
  browser.browserAction?.setPopup &&
    browser.browserAction.setPopup({ popup: '' });
}

export async function openOnboardingUi() {
  const { tabId, windowId } = await loadState();
  let tabExist = false;
  if (tabId != null && windowId != null) {
    try {
      const tab = await browser.tabs.get(tabId);
      if (tab != null) {
        tabExist = true;
        // activate existing tab
        browser.windows.update(windowId, { focused: true });
        browser.tabs.update(tabId, { active: true });
      }
    } catch (e) {
      // error expected to follow up in the next condition
    }
  }

  if (!tabExist) {
    browser.tabs
      .create({ url: 'onboarding.html', active: true })
      .then(tab => {
        if (tab.id != null && tab.windowId != null) {
          saveState({ tabId: tab.id, windowId: tab.windowId });
        }
      })
      .catch(e => console.error(e));
  }
}

async function loadState() {
  try {
    const { [storageKey]: state } = await browser.storage.local.get(storageKey);
    return (state || {}) as OnboardingFlowState;
  } catch {
    // reset on error
    localStorage.setItem(storageKey, '{}');
    return {} as OnboardingFlowState;
  }
}

async function saveState(state: OnboardingFlowState) {
  return browser.storage.local.set({ [storageKey]: state });
}
