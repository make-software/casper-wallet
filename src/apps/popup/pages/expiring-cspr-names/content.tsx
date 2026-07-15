import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedSpaceBetweenFlexRow,
  BorderBottomPseudoElementProps,
  ContentContainer,
  FlexColumn,
  ParagraphContainer,
  SpacingSize,
  borderBottomPseudoElementRules
} from '@libs/layout';
import { useExpiringCsprNames } from '@libs/services/account-info';
import { Tile, Typography } from '@libs/ui/components';
import { formatShortDate } from '@libs/ui/utils';

const RowsContainer = styled(FlexColumn)<BorderBottomPseudoElementProps>`
  & > *:not(:last-child) {
    ${borderBottomPseudoElementRules};
  }

  & > *:last-child {
    padding-left: ${({ marginLeftForSeparatorLine }) =>
      marginLeftForSeparatorLine}px;
  }
`;

const RowContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px 16px 16px 0;
`;

export const ExpiringCsprNamesContent = () => {
  const { t } = useTranslation();
  const { expiringNames } = useExpiringCsprNames();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>CSPR.name expirations</Trans>
        </Typography>
      </ParagraphContainer>
      <Tile style={{ marginTop: '16px' }}>
        <RowsContainer marginLeftForSeparatorLine={16}>
          {expiringNames.map(({ publicKey, csprName, expiresAt }) => (
            <RowContainer key={publicKey}>
              <Typography type="captionRegular" color="contentSecondary">
                {csprName}
              </Typography>
              <Typography type="captionRegular">
                {formatShortDate(expiresAt)}
              </Typography>
            </RowContainer>
          ))}
        </RowsContainer>
      </Tile>
    </ContentContainer>
  );
};
