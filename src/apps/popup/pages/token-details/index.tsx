import React from 'react';
import { useParams } from 'react-router-dom';

import {
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { useFetchErc20Tokens } from '@src/hooks';

import { TokenPageContent } from './content';

export const TokenDetailPage = () => {
  const erc20Tokens = useFetchErc20Tokens();
  const { tokenName } = useParams();

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
              <HeaderViewInExplorer tokenName={tokenName} />
            </>
          )}
        />
      )}
      renderContent={() => <TokenPageContent erc20Tokens={erc20Tokens} />}
    />
  );
};
