import manifestV2 from './manifest.v2.json';
import manifestV2Safari from './manifest.v2.safari.json';
import manifestV3 from './manifest.v3.json';

// `syncOnboardingFlow` attaches the popup only once the background has read the
// vault; without a default, a click opens onboarding over a merely locked wallet.
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
