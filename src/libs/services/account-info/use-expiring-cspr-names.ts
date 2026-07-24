import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { getCasperNetwork } from '@src/constants';

import { expiringCsprNamesDismissed } from '@background/redux/cspr-name-expirations/actions';
import { selectCsprNameExpirations } from '@background/redux/cspr-name-expirations/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { getExpiringCsprNames } from './expiring-cspr-names';

export const useExpiringCsprNames = () => {
  const expirations = useSelector(selectCsprNameExpirations);
  const networkSetting = useSelector(selectActiveNetworkSetting);

  const network = getCasperNetwork(networkSetting);

  // Time reference captured once per mount, keeping render pure (react-hooks
  // purity rule). A popup session lives seconds while the notice window spans
  // days, so a stable "now" cannot change which names count as expiring.
  const [now] = useState(() => Date.now());

  const expiringNames = useMemo(
    () => getExpiringCsprNames(expirations[network] ?? {}, now),
    [expirations, network, now]
  );

  const dismissExpiringNames = useCallback(() => {
    dispatchToMainStore(
      expiringCsprNamesDismissed({
        network,
        publicKeys: expiringNames.map(({ publicKey }) => publicKey)
      })
    );
  }, [network, expiringNames]);

  return {
    expiringNames,
    showExpirationBanner: expiringNames.some(({ dismissed }) => !dismissed),
    dismissExpiringNames
  };
};
