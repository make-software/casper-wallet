import { useEffect } from 'react';

export const useSafariCSP = () => {
  const { userAgent } = navigator;

  useEffect(() => {
    const isSafari = userAgent.indexOf('Safari') > -1;
    const isChrome = userAgent.indexOf('Chrome') > -1;

    // One additional check is required in the case of the Safari browser as the user-agent of the Chrome browser also includes the Safari browser’s user-agent.
    // If both the user-agents of Chrome and Safari are in the user-agent, it means that the browser is Chrome, and hence the Safari browser value is discarded.
    if (isSafari && !isChrome) {
      const metaCSP = document.querySelector(
        'meta[http-equiv="Content-Security-Policy"]'
      );

      if (metaCSP) {
        return;
      }

      const link = document.createElement('meta');

      link.setAttribute('http-equiv', 'Content-Security-Policy');
      link.content =
        "default-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; script-src 'self'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: data:; connect-src https://event-store-api-clarity-testnet.make.services";
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [userAgent]);
};
