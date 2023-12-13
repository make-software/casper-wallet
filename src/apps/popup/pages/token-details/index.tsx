import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { selectErc20Tokens } from '@background/redux/account-info/selectors';

import { TokenPageContent } from './content';

export const TokenDetailPage = () => {
  const erc20Tokens = useSelector(selectErc20Tokens);
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
              <HeaderViewInExplorer
                tokenName={tokenName}
                erc20Tokens={erc20Tokens}
              />
            </>
          )}
        />
      )}
      renderContent={() => <TokenPageContent erc20Tokens={erc20Tokens} />}
    />
  );
};
