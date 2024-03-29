import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectAccountNftTokens } from '@background/redux/account-info/selectors';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupLayout
} from '@libs/layout';
import { HomePageTabsId } from '@libs/ui/components';

import { NftDetailsContent } from './content';

export const NftDetailsPage = () => {
  const { contractPackageHash, tokenId } = useParams();
  const navigate = useTypedNavigate();

  const nftTokes = useSelector(selectAccountNftTokens);

  const nftToken = useMemo(
    () =>
      nftTokes?.find(
        token =>
          token.token_id === tokenId &&
          token.contract_package_hash === contractPackageHash
      ),
    [contractPackageHash, nftTokes, tokenId]
  );

  useEffect(() => {
    if (!nftToken) {
      navigate(RouterPath.Home);
    }
  }, [navigate, nftToken]);

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <>
              <HeaderSubmenuBarNavLink
                linkType="back"
                onClick={() =>
                  navigate(RouterPath.Home, {
                    state: { activeTabId: HomePageTabsId.NFTs }
                  })
                }
              />
              <HeaderViewInExplorer
                nftTokenId={tokenId}
                contractHash={contractPackageHash}
              />
            </>
          )}
        />
      )}
      renderContent={() => <NftDetailsContent nftToken={nftToken || null} />}
    />
  );
};
