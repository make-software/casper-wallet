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
import { ConnectAccountContent } from './content';
import styled from 'styled-components';

const TextCentredContainer = styled.div`
  text-align: center;
`;

export interface Props {
  selectedAccountNames: string[];
  setSelectedAccountNames: Dispatch<SetStateAction<string[]>>;
  origin: string;
  title: string;
}

export function ConnectAccountPage({
  selectedAccountNames,
  setSelectedAccountNames,
  origin,
  title
}: Props) {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  return (
    <LayoutWindow
      variant="default"
      renderHeader={() => (
        <PopupHeader
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="cancelWindow" />
          )}
        />
      )}
      renderContent={() => (
        <ConnectAccountContent
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
            onClick={() => navigate(RouterPath.ApproveConnection)}
          >
            <Trans t={t}>Next</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
