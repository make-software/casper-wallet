import { CasperNetwork } from 'casper-wallet-core';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { expiringCsprNamesDismissed } from '@background/redux/cspr-name-expirations/actions';
import { selectCsprNameExpirations } from '@background/redux/cspr-name-expirations/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { getExpiringCsprNames } from './expiring-cspr-names';

export const useExpiringCsprNames = () => {
  const expirations = useSelector(selectCsprNameExpirations);
  const networkSetting = useSelector(selectActiveNetworkSetting);

  const network = networkSetting.toLowerCase() as CasperNetwork;

  const expiringNames = useMemo(
    () => getExpiringCsprNames(expirations[network] ?? {}, Date.now()),
    [expirations, network]
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
