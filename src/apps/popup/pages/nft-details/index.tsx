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

import { NftDetailsContent } from './content';

export const NftDetailsPage = () => {
  const { contractPackageHash, tokenId } = useParams();

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
              <HeaderSubmenuBarNavLink linkType="back" />
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
