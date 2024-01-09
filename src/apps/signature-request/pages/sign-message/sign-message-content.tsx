import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  PageContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { FormField, Input, TextArea, Typography } from '@libs/ui/components';
import { truncateKey } from '@libs/ui/components/hash/utils';

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
        <ParagraphContainer top={SpacingSize.XL}>
          <Typography type="header">
            <Trans t={t}>Signature Request</Trans>
          </Typography>
        </ParagraphContainer>
        <ParagraphContainer top={SpacingSize.XL}>
          <FormField label={t('Message:')}>
            <Typography type="body">
              <TextArea value={message} readOnly style={{ minHeight: 250 }} />
            </Typography>
          </FormField>
        </ParagraphContainer>
        <ParagraphContainer top={SpacingSize.Small}>
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
