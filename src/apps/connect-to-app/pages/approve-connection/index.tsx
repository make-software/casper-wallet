import { t } from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import { closeActiveWindow } from '@src/background/close-window';
import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  PopupHeader
} from '@src/libs/layout';
import { Button, Typography } from '@src/libs/ui';

import { RouterPath, useTypedNavigate } from '../../router';
import { ApproveConnectionContent } from './content';

const TextCentredContainer = styled.div`
  text-align: center;
`;

export interface Props {
  selectedAccountNames: string[];
  origin: string;
  title: string;
}

export function ApproveConnectionPage({
  selectedAccountNames,
  origin,
  title
}: Props) {
  const navigate = useTypedNavigate();
  const { connectAccountsWithEvent: connectAccounts } = useAccountManager();

  const handleApproveConnection = () => {
    connectAccounts(selectedAccountNames, origin);
    navigate(RouterPath.Connecting);
  };

  const selectedAccountNamesLength = selectedAccountNames.length;
  return (
    <LayoutWindow
      Header={
        <PopupHeader
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      }
      Content={<ApproveConnectionContent origin={origin} title={title} />}
      renderFooter={() => (
        <FooterButtonsContainer>
          <TextCentredContainer>
            <Typography type="captionRegular">
              <Trans t={t}>Only connect with sites you trust</Trans>
            </Typography>
          </TextCentredContainer>
          <Button onClick={handleApproveConnection}>
            {/* TODO: optimize text in Trans component below */}
            <Trans t={t}>
              Connect to {{ selectedAccountNamesLength }}{' '}
              {selectedAccountNames.length > 1 ? t('accounts') : t('account')}
            </Trans>
          </Button>
          <Button color="secondaryBlue" onClick={() => closeActiveWindow()}>
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
