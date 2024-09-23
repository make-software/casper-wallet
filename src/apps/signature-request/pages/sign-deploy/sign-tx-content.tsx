import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  PageContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Typography } from '@libs/ui/components';

export interface SignDeployContentProps {
  tx?: any;
  txJson?: any;
  signingPublicKeyHex: string;
}

export function SignTxContent({
  tx,
  txJson,
  signingPublicKeyHex
}: SignDeployContentProps) {
  const { t } = useTranslation();

  if (tx == null) {
    return null;
  }

  return (
    <PageContainer>
      <ContentContainer>
        <ParagraphContainer top={SpacingSize.XL}>
          <Typography type="header">
            <Trans t={t}>Signature Request</Trans>
          </Typography>
        </ParagraphContainer>
        <ParagraphContainer top={SpacingSize.XL}>
          <Typography type="body">
            <p>Signing PublicKey Hex:</p>
            <p style={{ lineBreak: 'anywhere' }}>{`${signingPublicKeyHex}`}</p>
          </Typography>
          <div style={{ marginTop: 10 }}>
            <Typography type="body">
              <p>TransactionV1 JSON:</p>
              <pre>{JSON.stringify(txJson, null, ' ')}</pre>
            </Typography>
          </div>
        </ParagraphContainer>
      </ContentContainer>
    </PageContainer>
  );
}
