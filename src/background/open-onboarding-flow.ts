import {
  action,
  browserAction,
  storage,
  tabs,
  windows
} from 'webextension-polyfill';

const ONBOARDING_TAB_STATE_KEY = 'onboarding_tab_state';

type OnboardingFlowState = { tabId: number; windowId: number };

export async function disableOnboardingFlow() {
  action?.setPopup && action.setPopup({ popup: 'popup.html' });
  browserAction?.setPopup && browserAction.setPopup({ popup: 'popup.html' });
  storage.local.remove(ONBOARDING_TAB_STATE_KEY);
}

export async function enableOnboardingFlow() {
  action?.setPopup && action.setPopup({ popup: '' });
  browserAction?.setPopup && browserAction.setPopup({ popup: '' });
}

export async function openOnboardingUi() {
  const { tabId, windowId } = await loadState();
  let tabExist = false;

  if (tabId != null && windowId != null) {
    try {
      const tab = await tabs.get(tabId);
      if (tab != null) {
        tabExist = true;
        // activate existing tab
        windows.update(windowId, { focused: true });
        tabs.update(tabId, { active: true });
      }
    } catch (e) {
      // error expected to follow up in the next condition
    }
  }

  // this needed for case when the user goes to another url from onboarding
  // and then click on Casper Wallet from the extension menu
  const tab =
    tabId != null &&
    (await tabs.get(tabId).catch(() => {
      // catch error if the tab does not exist
    }));
  // check if the tab URL is the onboarding URL
  const isOnboardingUrl = tab && tab.url?.includes('onboarding.html');

  // create a tab if it does not exist or if it's not an onboarding URL
  if (!tabExist || !isOnboardingUrl) {
    tabs
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
    const { [ONBOARDING_TAB_STATE_KEY]: state } = await storage.local.get(
      ONBOARDING_TAB_STATE_KEY
    );
    return (state || {}) as OnboardingFlowState;
  } catch {
    // reset on error
    localStorage.setItem(ONBOARDING_TAB_STATE_KEY, '{}');
    return {} as OnboardingFlowState;
  }
}

async function saveState(state: OnboardingFlowState) {
  return storage.local.set({ [ONBOARDING_TAB_STATE_KEY]: state });
}
