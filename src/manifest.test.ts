import manifestV2 from './manifest.v2.json';
import manifestV2Safari from './manifest.v2.safari.json';
import manifestV3 from './manifest.v3.json';

// The popup is attached at runtime by `syncOnboardingFlow`, which cannot run until the
// background has read the vault out of storage. Without a manifest default the icon has no
// popup for that window, and a click falls through to `action.onClicked` — opening the
// onboarding tab over a wallet that is merely locked.
describe('toolbar action popup', () => {
  it('is served by the manifest on MV3', () => {
    expect(manifestV3.action.default_popup).toBe('popup.html');
  });

  it('is served by the manifest on MV2 (Firefox)', () => {
    expect(manifestV2.browser_action.default_popup).toBe('popup.html');
  });

  it('is served by the manifest on MV2 (Safari)', () => {
    expect(manifestV2Safari.browser_action.default_popup).toBe('popup.html');
  });
});
