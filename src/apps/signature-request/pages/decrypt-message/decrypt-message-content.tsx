import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components';

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
  hasDecryptionError: boolean;
  decryptedMessage: string;
  publicKeyHex: string;
}

export function DecryptMessageContent({
  message,
  hasDecryptionError,
  decryptedMessage,
  publicKeyHex
}: SignMessageContentProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <PageContainer>
      <ContentContainer>
        <ParagraphContainer top={SpacingSize.XL}>
          <Typography type="header">
            <Trans t={t}>Decrypt Message Request</Trans>
          </Typography>
        </ParagraphContainer>
        {hasDecryptionError && (
          <ParagraphContainer top={SpacingSize.XL}>
            <FormField label={t('Decryption error:')}>
              <Typography type="body" color="contentWarning">
                <TextArea
                  value={'Unable to decrypt message with provided publicKey'}
                  readOnly
                  style={{
                    maxHeight: 125,
                    color: theme.color.contentActionCritical
                  }}
                />
              </Typography>
            </FormField>
          </ParagraphContainer>
        )}
        <ParagraphContainer top={SpacingSize.XL}>
          <FormField
            label={t(decryptedMessage ? 'Decrypted message:' : 'Message:')}
          >
            <Typography type="body">
              <TextArea
                value={decryptedMessage || message}
                readOnly
                style={{ minHeight: 250 }}
              />
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
