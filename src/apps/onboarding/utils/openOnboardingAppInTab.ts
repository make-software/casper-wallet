import browser from 'webextension-polyfill';

export function openOnboardingAppInTab() {
  browser.tabs
    .create({ url: 'onboarding.html', active: true })
    .catch(e => console.error(e));
}
