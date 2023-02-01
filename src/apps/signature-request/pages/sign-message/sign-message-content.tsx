import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  PageContainer,
  ParagraphContainer
} from '@layout/containers';
import { FormField, Input, TextArea, Typography } from '@libs/ui';
import { truncateKey } from '@src/libs/ui/components/hash/utils';

export interface SignMessageContentProps {
  message: string;
  publicKeyHex: string;
}

export function SignMessageContent({
  message,
  publicKeyHex
}: SignMessageContentProps) {
  const { t } = useTranslation();

  const LabelDict = {
    casperMessage: t('Casper Message:'),
    signingKey: t('Signing Key:')
  };

  return (
    <PageContainer>
      <ContentContainer>
        <ParagraphContainer gap="big">
          <Typography type="header">
            <Trans t={t}>Signature Request</Trans>
          </Typography>
        </ParagraphContainer>
        <ParagraphContainer gap="big">
          <FormField label={LabelDict.casperMessage}>
            <Typography type="body">
              <TextArea value={message} readOnly style={{ minHeight: 260 }} />
            </Typography>
          </FormField>
        </ParagraphContainer>
        <ParagraphContainer gap="small">
          <FormField label={LabelDict.signingKey}>
            <Typography type="body">
              <Input
                value={truncateKey(publicKeyHex, { size: 'max' })}
                readOnly
              />
            </Typography>
          </FormField>
        </ParagraphContainer>
      </ContentContainer>
    </PageContainer>
  );
}
