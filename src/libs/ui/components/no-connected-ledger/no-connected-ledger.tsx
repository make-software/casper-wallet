import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { List, SvgIcon, Typography } from '@libs/ui/components';

const ItemContainer = styled(AlignedFlexRow)`
  padding: 16px;
`;

const steps = [
  {
    id: 1,
    text: 'Plug in your Ledger to the device'
  },
  {
    id: 2,
    text: 'Open Casper app on your Ledger'
  },
  {
    id: 3,
    text: 'Get back here to see txn details'
  }
];

export const NoConnectedLedger = () => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/ledger-connect.svg"
          width={296}
          height={120}
        />
      </IllustrationContainer>

      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Looks like your Ledger is not connected</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Follow the steps to be able to [Sign/Confirm] transaction with
            Ledger.
          </Trans>
        </Typography>
      </ParagraphContainer>

      <List
        rows={steps}
        renderRow={({ text }) => (
          <ItemContainer gap={SpacingSize.Large}>
            <SvgIcon src="assets/icons/radio-button-on.svg" />
            <Typography type="body">
              <Trans t={t}>{text}</Trans>
            </Typography>
          </ItemContainer>
        )}
        marginLeftForItemSeparatorLine={56}
      />
    </ContentContainer>
  );
};
