import { action, browserAction, storage } from 'webextension-polyfill';

import { syncOnboardingFlow } from '@background/open-onboarding-flow';

jest.mock('webextension-polyfill', () => ({
  action: { setPopup: jest.fn() },
  browserAction: { setPopup: jest.fn() },
  storage: { local: { get: jest.fn(), set: jest.fn(), remove: jest.fn() } },
  tabs: { get: jest.fn(), create: jest.fn(), update: jest.fn() },
  windows: { update: jest.fn() }
}));

describe('syncOnboardingFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('attaches the popup once onboarding is complete', async () => {
    await syncOnboardingFlow(true);

    expect(action.setPopup).toHaveBeenCalledWith({ popup: 'popup.html' });
    expect(browserAction.setPopup).toHaveBeenCalledWith({
      popup: 'popup.html'
    });
  });

  it('drops the remembered onboarding tab once onboarding is complete', async () => {
    await syncOnboardingFlow(true);

    expect(storage.local.remove).toHaveBeenCalled();
  });

  // An empty string, never `null`: `null` restores the manifest's `default_popup`, which is
  // the popup this call exists to get out of the way.
  it('detaches the manifest default while onboarding is unfinished', async () => {
    await syncOnboardingFlow(false);

    expect(action.setPopup).toHaveBeenCalledWith({ popup: '' });
    expect(browserAction.setPopup).toHaveBeenCalledWith({ popup: '' });
  });

  it('leaves the remembered onboarding tab alone while onboarding is unfinished', async () => {
    await syncOnboardingFlow(false);

    expect(storage.local.remove).not.toHaveBeenCalled();
  });
});
