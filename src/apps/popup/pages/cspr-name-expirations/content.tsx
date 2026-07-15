import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from 'typesafe-actions';

import { selectExpiringCsprNames } from '@background/redux/cspr-name-expirations/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';

import {
  AlignedSpaceBetweenFlexRow,
  BorderBottomPseudoElementProps,
  ContentContainer,
  FlexColumn,
  SpacingSize,
  borderBottomPseudoElementRules
} from '@libs/layout';
import { Tile, Typography } from '@libs/ui/components';
import { formatDateWithoutTime } from '@libs/ui/utils/formatters';

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

const RowContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px 16px 16px 0;
`;

export const CsprNameExpirationsContent: React.FC = () => {
  const networkSetting = useSelector(selectActiveNetworkSetting);
  const network = networkSetting.toLowerCase() as CasperNetwork;
  const expiringNames = useSelector((state: RootState) =>
    selectExpiringCsprNames(state, network)
  );

  return (
    <ContentContainer>
      <Tile style={{ marginTop: '16px' }}>
        <RowsContainer marginLeftForSeparatorLine={16}>
          {expiringNames.map(name => (
            <RowContainer key={name.publicKey} gap={SpacingSize.Medium}>
              <Typography type="captionRegular" color="contentSecondary">
                {name.csprName}
              </Typography>
              <Typography type="captionRegular">
                {formatDateWithoutTime(name.expiresAt)}
              </Typography>
            </RowContainer>
          ))}
        </RowsContainer>
      </Tile>
    </ContentContainer>
  );
};
