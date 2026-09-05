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
  // The sheet's height is fixed, so content taller than it has to scroll here or it escapes
  // past the footer and off-screen. The zero min-height is what lets this flex item shrink
  // below its content at all; without it the overflow rule has nothing to clip against.
  min-height: 0;
  overflow-y: auto;
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
  /** Runs when Done is pressed. Defaults to `closeSwitcher`, so a picker whose Done
   *  only dismisses the sheet needs no change. */
  onDone?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  children: React.ReactNode;
}

export const ModalSwitcher = ({
  label,
  closeSwitcher,
  onDone,
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
        <Button onClick={onDone ?? closeSwitcher}>
          <Trans t={t}>Done</Trans>
        </Button>
      </FooterButtonsContainer>
    </Container>
  );
};
