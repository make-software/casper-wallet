import React from 'react';
import { useParams } from 'react-router-dom';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  HeaderViewInExplorer,
  PopupLayout
} from '@libs/layout';
import { useFetchCep18Tokens } from '@libs/services/cep18-service';

import { TokenPageContent } from './content';

export const TokenDetailPage = () => {
  const { tokenName } = useParams();

  const { cep18Tokens } = useFetchCep18Tokens();

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <>
              <HeaderSubmenuBarNavLink linkType="back" />
              <HeaderViewInExplorer
                tokenName={tokenName}
                cep18Tokens={cep18Tokens}
              />
            </>
          )}
        />
      )}
      renderContent={() => <TokenPageContent />}
    />
  );
};
