import { IDeploy } from 'casper-wallet-core';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { DeployDetailsAction } from '@popup/pages/deploy-details/components/deploy-details-action';
import { DeployDetailsResult } from '@popup/pages/deploy-details/components/deploy-details-result';
import { getEntryPointName } from '@popup/pages/deploy-details/utils';

import {
  AlignedFlexRow,
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
import { useFetchDeploy } from '@libs/services/deploys/use-fetch-deploy';
import {
  DeployStatus,
  Hash,
  HashVariant,
  Status,
  SvgIcon,
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

interface DeployDetailsPageContentProps {
  deploy?: IDeploy;
}

export const DeployDetailsPageContent = ({
  deploy
}: DeployDetailsPageContentProps) => {
  const [singleDeploy, setSingleDeploy] = useState<IDeploy | null | undefined>(
    null
  );

  const { t } = useTranslation();

  useEffect(() => {
    setSingleDeploy(deploy);
  }, [deploy]);

  const { deployData } = useFetchDeploy(deploy?.deployHash);

  useEffect(() => {
    if (deployData) {
      setSingleDeploy(deployData);
    }
  }, [deployData]);

  if (!singleDeploy) {
    return null;
  }

  const deployName = getEntryPointName(singleDeploy, true);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <TitleContainer>
          <Typography type="header" wordBreak>
            <Trans t={t}>{deployName}</Trans>
          </Typography>
          <DeployStatus
            textWithIcon
            deployResult={{
              status: singleDeploy.status,
              errorMessage: singleDeploy.errorMessage
            }}
          />
        </TitleContainer>
      </ParagraphContainer>
      <DeployDetailsAction deploy={singleDeploy} />
      <DeployDetailsResult deploy={singleDeploy} />
      <Tile style={{ marginTop: '16px' }}>
        <RowsContainer marginLeftForSeparatorLine={16}>
          {singleDeploy.errorMessage &&
            singleDeploy.status === Status.Error && (
              <RowContainer gap={SpacingSize.Medium}>
                <Typography type="captionRegular" color="contentSecondary">
                  <Trans t={t}>Status</Trans>
                </Typography>
                <AlignedFlexRow gap={SpacingSize.Small}>
                  <SvgIcon
                    src="assets/icons/error.svg"
                    color="contentActionCritical"
                    size={20}
                  />
                  <Typography type="captionRegular" wordBreak>
                    {singleDeploy.errorMessage}
                  </Typography>
                </AlignedFlexRow>
              </RowContainer>
            )}
          <RowContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Deploy hash</Trans>
            </Typography>
            <Hash
              value={singleDeploy.deployHash}
              variant={HashVariant.CaptionHash}
              truncated
              color="contentPrimary"
              placement="topLeft"
              withCopyIcon
            />
          </RowContainer>
          <RowContainer>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Timestamp</Trans>
            </Typography>
            <Typography type="captionRegular">
              {formatShortTimestamp(singleDeploy.timestamp)}
            </Typography>
          </RowContainer>
          <RowContainer withTwoRows>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Payment amount</Trans>
            </Typography>
            <RightAlignedFlexColumn>
              <FlexRow gap={SpacingSize.Tiny}>
                <Typography type="captionHash">
                  {singleDeploy.formattedPaymentAmount}
                </Typography>
                <Typography type="captionHash" color="contentSecondary">
                  CSPR
                </Typography>
              </FlexRow>
              <Typography type="captionRegular" color="contentSecondary">
                {singleDeploy.fiatPaymentAmount}
              </Typography>
            </RightAlignedFlexColumn>
          </RowContainer>
          <RowContainer withTwoRows>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Cost</Trans>
            </Typography>
            <RightAlignedFlexColumn>
              <FlexRow gap={SpacingSize.Tiny}>
                <Typography type="captionHash">
                  {singleDeploy.formattedCost}
                </Typography>
                <Typography type="captionHash" color="contentSecondary">
                  CSPR
                </Typography>
              </FlexRow>
              <Typography type="captionRegular" color="contentSecondary">
                {singleDeploy.fiatCost}
              </Typography>
            </RightAlignedFlexColumn>
          </RowContainer>
        </RowsContainer>
      </Tile>
    </ContentContainer>
  );
};
