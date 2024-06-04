import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  FlexColumn,
  FooterButtonsContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Button, Typography } from '@libs/ui/components';

const Container = styled(FlexColumn)`
  background-color: ${({ theme }) => theme.color.backgroundSecondary};
  border-top-right-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  border-top-left-radius: ${({ theme }) => theme.borderRadius.sixteen}px;

  height: 528px;
`;

const ContentContainer = styled.div`
  padding: 0 16px;

  flex-grow: 1;
`;

const HeaderContainer = styled(AlignedFlexRow)`
  padding: 16px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-top-right-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  border-top-left-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
`;

const CancelButton = styled(Typography)`
  cursor: pointer;
`;

interface SwitcherProps {
  label: string;
  closeSwitcher: (e: React.MouseEvent<Element, MouseEvent>) => void;
  children: React.ReactNode;
}

export const ModalSwitcher = ({
  label,
  closeSwitcher,
  children
}: SwitcherProps) => {
  const { t } = useTranslation();

  return (
    <Container>
      <HeaderContainer>
        <CancelButton
          type="bodySemiBold"
          color="contentAction"
          onClick={closeSwitcher}
        >
          <Trans t={t}>Cancel</Trans>
        </CancelButton>
      </HeaderContainer>

      <ContentContainer>
        <ParagraphContainer top={SpacingSize.XL}>
          <Typography type="header">
            <Trans t={t}>{label}</Trans>
          </Typography>
        </ParagraphContainer>

        {children}
      </ContentContainer>

      <FooterButtonsContainer>
        <Button onClick={closeSwitcher}>
          <Trans t={t}>Done</Trans>
        </Button>
      </FooterButtonsContainer>
    </Container>
  );
};
