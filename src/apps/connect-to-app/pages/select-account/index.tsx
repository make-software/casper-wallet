import React, { Dispatch, SetStateAction } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  PopupHeader
} from '@src/libs/layout';
import { Button, Typography } from '@src/libs/ui';

import { RouterPath, useTypedNavigate } from '../../router';
import { SelectAccountContent } from './content';
import styled from 'styled-components';
import { sendSdkResponseToSpecificTab } from '@src/background/send-sdk-response-to-specific-tab';
import { sdkMethod } from '@src/content/sdk-method';
import { closeCurrentWindow } from '@src/background/close-current-window';
import { selectIsActiveAccountConnectedWithActiveOrigin } from '@src/background/redux/vault/selectors';
import { useSelector } from 'react-redux';

const TextCentredContainer = styled.div`
  text-align: center;
`;

export interface SelectAccountPageProps {
  selectedAccountNames: string[];
  setSelectedAccountNames: Dispatch<SetStateAction<string[]>>;
  origin: string;
  title: string;
}

export function SelectAccountPage({
  selectedAccountNames,
  setSelectedAccountNames,
  origin,
  title
}: SelectAccountPageProps) {
  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    const error = Error(`Missing search param: ${requestId}`);
    throw error;
  }

  const isActiveAccountConnected = useSelector(
    selectIsActiveAccountConnectedWithActiveOrigin
  );
  if (isActiveAccountConnected) {
    sendSdkResponseToSpecificTab(
      sdkMethod.connectResponse(true, { requestId })
    ).then(() => {
      closeCurrentWindow();
    });
  }

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const handleCancel = async () => {
    await sendSdkResponseToSpecificTab(
      sdkMethod.connectResponse(false, { requestId })
    );
    closeCurrentWindow();
  };

  const handleAccountSelection = () => navigate(RouterPath.ApproveConnection);

  return (
    <LayoutWindow
      renderHeader={() => (
        <PopupHeader
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType="cancelWindow"
              onClick={handleCancel}
            />
          )}
        />
      )}
      renderContent={() => (
        <SelectAccountContent
          selectedAccountNames={selectedAccountNames}
          setSelectedAccountNames={setSelectedAccountNames}
          origin={origin}
          headerText={title}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <TextCentredContainer>
            <Typography type="captionRegular">
              <Trans t={t}>Only connect with sites you trust</Trans>
            </Typography>
          </TextCentredContainer>
          <Button
            disabled={selectedAccountNames.length === 0}
            onClick={handleAccountSelection}
          >
            <Trans t={t}>Next</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
