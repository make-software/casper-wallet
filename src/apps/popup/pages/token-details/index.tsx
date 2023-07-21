import React from 'react';

import {
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupHeader,
  PopupLayout
} from '@libs/layout';

import { TokenPageContent } from './content';
import { useErc20Tokens } from '@src/hooks';
import { useParams } from 'react-router-dom';

export const TokenDetailPage = () => {
  const erc20Tokens = useErc20Tokens();
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
