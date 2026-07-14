import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';

import { selectExpiringCsprNames } from '@background/redux/cspr-name-expirations/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';

import {
  ContentContainer,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { List, Typography } from '@libs/ui/components';
import { formatDateWithoutTime } from '@libs/ui/utils/formatters';

export const CsprNameExpirationsContent: React.FC = () => {
  const networkSetting = useSelector(selectActiveNetworkSetting);
  const network = networkSetting.toLowerCase() as CasperNetwork;
  const expiringNames = useSelector((state: RootState) =>
    selectExpiringCsprNames(state, network)
  );

  const rows = expiringNames.map(name => ({ ...name, id: name.publicKey }));

  return (
    <ContentContainer>
      <List
        contentTop={SpacingSize.Small}
        rows={rows}
        renderRow={row => (
          <SpaceBetweenFlexRow>
            <Typography type="body">{row.csprName}</Typography>
            <Typography type="body" color="contentSecondary">
              {formatDateWithoutTime(row.expiresAt)}
            </Typography>
          </SpaceBetweenFlexRow>
        )}
        marginLeftForItemSeparatorLine={16}
      />
    </ContentContainer>
  );
};
