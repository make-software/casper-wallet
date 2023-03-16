import { t } from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import { closeCurrentWindow } from '@src/background/close-current-window';
import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  PopupHeader
} from '@src/libs/layout';
import { Button, Typography } from '@src/libs/ui';

import { RouterPath, useTypedNavigate } from '../../router';
import { ApproveConnectionContent } from './content';
import { sendSdkResponseToSpecificTab } from '@src/background/send-sdk-response-to-specific-tab';
import { sdkMethod } from '@src/content/sdk-method';

const TextCentredContainer = styled.div`
  text-align: center;
`;

export interface Props {
  selectedAccountNames: string[];
  origin: string;
  title: string;
  siteTitle: string;
}

export function ApproveConnectionPage({
  selectedAccountNames,
  origin,
  title,
  siteTitle
}: Props) {
  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    const error = Error(`Missing search param: ${requestId}`);
    throw error;
  }

  const selectedAccountNamesLength = selectedAccountNames.length;

  const navigate = useTypedNavigate();
  const { connectAccountsWithEvent: connectAccounts } = useAccountManager();

  const handleApproveConnection = async () => {
    await connectAccounts(selectedAccountNames, origin, siteTitle);
    await sendSdkResponseToSpecificTab(
      sdkMethod.connectResponse(true, { requestId })
    );
    navigate(RouterPath.Connecting);
  };

  const handleCancel = async () => {
    await sendSdkResponseToSpecificTab(
      sdkMethod.connectResponse(false, { requestId })
    );
    closeCurrentWindow();
  };

  return (
    <LayoutWindow
      renderHeader={() => (
        <PopupHeader
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <ApproveConnectionContent origin={origin} title={title} />
      )}
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
          <Button color="secondaryBlue" onClick={handleCancel}>
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
