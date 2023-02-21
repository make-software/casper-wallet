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

  return (
    <PageContainer>
      <ContentContainer>
        <ParagraphContainer gap="big">
          <Typography type="header">
            <Trans t={t}>Signature Request</Trans>
          </Typography>
        </ParagraphContainer>
        <ParagraphContainer gap="big">
          <FormField label={t('Message:')}>
            <Typography type="body">
              <TextArea value={message} readOnly style={{ minHeight: 260 }} />
            </Typography>
          </FormField>
        </ParagraphContainer>
        <ParagraphContainer gap="small">
          <FormField label={t('Signing Key:')}>
            <Typography type="body">
              <Input
                value={truncateKey(publicKeyHex, { size: 'max' })}
                monotype
                readOnly
              />
            </Typography>
          </FormField>
        </ParagraphContainer>
      </ContentContainer>
    </PageContainer>
  );
}
