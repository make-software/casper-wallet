import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { selectAccountNftTokens } from '@background/redux/account-info/selectors';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { HomePageTabsId } from '@libs/ui';

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

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
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
