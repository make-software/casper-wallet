import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedSpaceBetweenFlexRow,
  ContentContainer,
  FlexColumn,
  FlexRow,
  LeftAlignedFlexColumn,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { ProviderProps } from '@libs/services/buy-cspr-service/types';
import { Checkbox, Tile, Typography } from '@libs/ui/components';

const ProviderContainer = styled(Tile)`
  margin-top: 16px;

  cursor: pointer;
`;

const Container = styled(FlexRow)`
  padding: 0 0 16px 16px;
`;

const ImageContainer = styled.div`
  padding-top: 16px;
`;

const Image = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

const CheckBoxContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding-top: 8px;
  padding-right: 16px;
`;

const DividerLine = styled.hr`
  margin-top: 8px;

  border-width: 0;
  height: 0.5px;
  background-color: ${({ theme }) => theme.color.borderPrimary};
`;

interface ProviderPageProps {
  availableProviders: ProviderProps[];
  setSelectedProviders: React.Dispatch<
    React.SetStateAction<ProviderProps | null>
  >;
  selectedProviders: ProviderProps | null;
}

export const Provider = ({
  availableProviders,
  setSelectedProviders,
  selectedProviders
}: ProviderPageProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>
            {availableProviders.length === 1
              ? 'Review provider option'
              : 'Pick provider'}
          </Trans>
        </Typography>
      </ParagraphContainer>

      {availableProviders.map(provider => {
        const isSelected =
          selectedProviders?.providerKey === provider.providerKey;
        return (
          <ProviderContainer
            key={provider.providerKey}
            onClick={() => {
              if (isSelected) {
                return;
              }
              setSelectedProviders(provider);
            }}
          >
            <Container gap={SpacingSize.Medium}>
              <ImageContainer>
                <Image
                  src={provider.logoPNG || provider.logoSVG}
                  alt={provider.providerName}
                />
              </ImageContainer>
              <FlexColumn gap={SpacingSize.Large} flexGrow={1}>
                <FlexColumn>
                  <CheckBoxContainer>
                    <LeftAlignedFlexColumn>
                      <Typography type="body">
                        {provider.providerName}
                      </Typography>
                      <Typography
                        type="captionRegular"
                        color="contentSecondary"
                      >
                        <Trans t={t}>Fees</Trans>
                        {` ~ ${provider.fees}`}
                      </Typography>
                    </LeftAlignedFlexColumn>
                    <Checkbox checked={isSelected} />
                  </CheckBoxContainer>
                  <DividerLine />
                </FlexColumn>
                <FlexColumn gap={SpacingSize.Tiny}>
                  <FlexRow gap={SpacingSize.Small}>
                    <Typography type="captionHash" color="contentSecondary">
                      1 CSPR
                    </Typography>
                    <Typography type="captionHash" color="contentSecondary">
                      ~
                    </Typography>
                    <Typography type="captionRegular" color="contentSecondary">
                      {provider.csprExchangeRate}
                    </Typography>
                  </FlexRow>
                  <FlexRow gap={SpacingSize.Small}>
                    <Typography type="captionRegular" color="contentSecondary">
                      <Trans t={t}>You’ll get:</Trans>
                    </Typography>
                    <Typography type="captionHash">{`${provider.cryptoAmount} CSPR`}</Typography>
                  </FlexRow>
                </FlexColumn>
              </FlexColumn>
            </Container>
          </ProviderContainer>
        );
      })}
    </ContentContainer>
  );
};
