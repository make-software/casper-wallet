// Import necessary modules
import { Browser } from '@src/constants';

// Enum for different steps involved in a rate app
export enum RateAppSteps {
  Navigation = 'navigation', // The navigation step in the rate app process
  Rate = 'rate', // The main rate-writing step
  Support = 'support' // The customer support step (if any) in the review process
}

/**
 * Function to identify the browser from the user agent.
 *
 * @returns {Browser | 'Unknown'} - The name of the browser the user is using.
 */
export const getBrowserFromUserAgent = (): Browser | 'Unknown' => {
  const userAgent = navigator.userAgent;

  // Run regex tests on the userAgent to identify the browser
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    return Browser.Chrome;
  } else if (/firefox/i.test(userAgent)) {
    return Browser.Firefox;
  } else if (/edg/i.test(userAgent)) {
    return Browser.Edge;
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    return Browser.Safari;
  } else {
    // if the browser can't be identified, return 'Unknown'
    return 'Unknown';
  }
};

// Map of rate app links for different browsers
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
