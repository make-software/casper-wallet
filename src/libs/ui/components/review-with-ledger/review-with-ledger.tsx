import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  CenteredFlexColumn,
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { FormField, TextArea, Typography } from '@libs/ui/components';

interface ReviewWithLedgerProps {
  txnHash: string;
}

const AnimationContainer = styled(CenteredFlexColumn)`
  margin-top: 60px;
`;

export const ReviewWithLedger = ({ txnHash }: ReviewWithLedgerProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Review and sign with Ledger </Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Compare the transaction hash on your Ledger device with the value
            below and approve or reject the signature.
          </Trans>
        </Typography>
      </ParagraphContainer>
      <VerticalSpaceContainer top={SpacingSize.Large}>
        <FormField label={t('Txn hash')}>
          <TextArea value={txnHash} readOnly rows={2} type="captionHash" />
        </FormField>
      </VerticalSpaceContainer>
      <AnimationContainer>animation</AnimationContainer>
    </ContentContainer>
  );
};
