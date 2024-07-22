import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { DeployDetailsAction } from '@popup/pages/deploy-details/components/deploy-details-action';
import { DeployDetailsResult } from '@popup/pages/deploy-details/components/deploy-details-result';

import {
  AlignedSpaceBetweenFlexRow,
  BorderBottomPseudoElementProps,
  ContentContainer,
  FlexColumn,
  FlexRow,
  ParagraphContainer,
  RightAlignedFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize,
  borderBottomPseudoElementRules
} from '@libs/layout';
import { ExtendedCloudDeploy } from '@libs/types/deploy';
import {
  DeployStatus,
  Hash,
  HashVariant,
  Tile,
  Typography
} from '@libs/ui/components';
import { formatShortTimestamp } from '@libs/ui/utils';

const TitleContainer = styled(SpaceBetweenFlexRow)`
  align-items: end;
`;

const RowsContainer = styled(FlexColumn)<BorderBottomPseudoElementProps>`
  margin-top: 12px;

  & > *:not(:last-child) {
    ${borderBottomPseudoElementRules};
  }

  & > *:last-child {
    padding-left: ${({ marginLeftForSeparatorLine }) =>
      marginLeftForSeparatorLine}px;
  }
`;

const RowContainer = styled(AlignedSpaceBetweenFlexRow)<{
  withTwoRows?: boolean;
}>`
  padding: ${({ withTwoRows }) =>
    withTwoRows ? '12px 16px 12px 0' : '16px 16px 16px 0'};
`;

export const DeployDetailsPageContent = () => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <TitleContainer>
          <Typography type="header">
            <Trans t={t}>Deploy name</Trans>
          </Typography>
          <DeployStatus
            textWithIcon
            deployResult={{ status: 'success', errorMessage: null }}
          />
        </TitleContainer>
      </ParagraphContainer>
      {/*TODO: pass deploy*/}
      <DeployDetailsAction deploy={{} as ExtendedCloudDeploy} />
      <DeployDetailsResult deploy={{} as ExtendedCloudDeploy} />
      <Tile style={{ marginTop: '16px' }}>
        <RowsContainer marginLeftForSeparatorLine={16}>
          <RowContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Deploy hash</Trans>
            </Typography>
            <Hash value={'deploy hash'} variant={HashVariant.CaptionHash} />
          </RowContainer>
          <RowContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Timestamp</Trans>
            </Typography>
            <Typography type="captionRegular">
              {formatShortTimestamp('2024-07-03T08:31:23.577Z')}
            </Typography>
          </RowContainer>
          <RowContainer withTwoRows>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Payment amount</Trans>
            </Typography>
            <RightAlignedFlexColumn>
              <FlexRow gap={SpacingSize.Tiny}>
                <Typography type="captionHash">1,000,000.00</Typography>
                <Typography type="captionHash" color="contentSecondary">
                  CSPR
                </Typography>
              </FlexRow>
              <Typography type="captionRegular" color="contentSecondary">
                $386.34
              </Typography>
            </RightAlignedFlexColumn>
          </RowContainer>
          <RowContainer withTwoRows>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Cost</Trans>
            </Typography>
            <RightAlignedFlexColumn>
              <FlexRow gap={SpacingSize.Tiny}>
                <Typography type="captionHash">1,000,000.00</Typography>
                <Typography type="captionHash" color="contentSecondary">
                  CSPR
                </Typography>
              </FlexRow>
              <Typography type="captionRegular" color="contentSecondary">
                $386.34
              </Typography>
            </RightAlignedFlexColumn>
          </RowContainer>
        </RowsContainer>
      </Tile>
    </ContentContainer>
  );
};
