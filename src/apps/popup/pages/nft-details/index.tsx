import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupLayout
} from '@libs/layout';
import { useFetchNftTokens } from '@libs/services/nft-service';
import { HomePageTabsId } from '@libs/ui/components';

import { NftDetailsContent } from './content';

export const NftDetailsPage = () => {
  const { contractPackageHash, tokenId } = useParams();
  const navigate = useTypedNavigate();

  const { nftTokens } = useFetchNftTokens();

  const nftToken = useMemo(
    () =>
      nftTokens?.find(
        token =>
          token.tokenId === tokenId &&
          token.contractPackageHash === contractPackageHash
      ),
    [contractPackageHash, nftTokens, tokenId]
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
