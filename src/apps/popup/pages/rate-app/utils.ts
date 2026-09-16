import { Browser } from '@src/constants';

export enum RateAppSteps {
  Navigation = 'navigation',
  Rate = 'rate',
  Support = 'support'
}

export const getBrowserFromUserAgent = (): Browser | 'Unknown' => {
  const userAgent = navigator.userAgent;

  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    return Browser.Chrome;
  } else if (/firefox/i.test(userAgent)) {
    return Browser.Firefox;
  } else if (/edg/i.test(userAgent)) {
    return Browser.Edge;
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    return Browser.Safari;
  } else {
    return 'Unknown';
  }
};

export const RateAppLinks = {
  [Browser.Chrome]:
    'https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp/reviews',
  [Browser.Firefox]:
    'https://addons.mozilla.org/en-US/firefox/addon/casper-wallet/',
  [Browser.Safari]: 'https://apps.apple.com/us/app/casper-wallet/id6446363274',
  [Browser.Edge]:
    'https://microsoftedge.microsoft.com/addons/detail/casper-wallet/dfmbcapkkeejcpmfhpnglndfkgmalhik',
  Unknown:
    'https://chromewebstore.google.com/detail/casper-wallet/abkahkcbhngaebpcgfmhkoioedceoigp/reviews'
};
