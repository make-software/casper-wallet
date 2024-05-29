import React from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  FlexColumn,
  FooterButtonsContainer,
  InputsContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Button, Input, SvgIcon, Typography } from '@libs/ui/components';

const Container = styled(FlexColumn)`
  background-color: ${({ theme }) => theme.color.backgroundSecondary};
  border-top-right-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  border-top-left-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
`;

const ContentContainer = styled.div`
  padding: 0 16px;
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
  label: 'Country' | 'Currency';
  closeSwitcher: (e: React.MouseEvent<Element, MouseEvent>) => void;
  children: React.ReactNode;
  register: UseFormRegister<FieldValues>;
  searchName: 'countryNameSearch' | 'currencySearch';
}

export const Switcher = ({
  label,
  closeSwitcher,
  children,
  register,
  searchName
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

        <InputsContainer>
          <Input
            prefixIcon={<SvgIcon src="assets/icons/search.svg" size={24} />}
            placeholder={t('Search')}
            {...register(searchName)}
          />
        </InputsContainer>

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
