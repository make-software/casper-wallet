import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  ContentContainer,
  FlexColumn,
  PageContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { FormField, Input, TextArea, Typography } from '@libs/ui/components';
import { truncateKey } from '@libs/ui/components/hash/utils';
import { MaybeLink } from '@libs/ui/components/maybe-link/maybe-link';
import { getFaviconUrlFromOrigin } from '@libs/ui/components/site-favicon-badge/site-favicon-badge';

const Favicon = styled.img`
  width: 40px;
  height: 40px;

  object-fit: contain;
  object-position: center;

  border-radius: ${({ theme }) => theme.borderRadius.twenty}px;
`;

export interface SignMessageContentProps {
  message: string;
  publicKeyHex: string;
  origin: string | null;
}

export function SignMessageContent({
  message,
  publicKeyHex,
  origin
}: SignMessageContentProps) {
  const { t } = useTranslation();
  const faviconUrl = getFaviconUrlFromOrigin(origin);

  return (
    <PageContainer>
      <ContentContainer>
        <VerticalSpaceContainer top={SpacingSize.Medium}>
          <AlignedFlexRow gap={SpacingSize.Small}>
            {faviconUrl && (
              <div>
                <Favicon src={faviconUrl} />
              </div>
            )}
            <FlexColumn flexGrow={1}>
              <Typography type="header">
                <Trans t={t}>Signature Request</Trans>
              </Typography>
              <MaybeLink link={origin}>
                <Typography
                  type="captionRegular"
                  color={'contentAction'}
                  ellipsis
                  style={{ maxWidth: '296px' }}
                >
                  <Trans t={t}>{origin}</Trans>
                </Typography>
              </MaybeLink>
            </FlexColumn>
          </AlignedFlexRow>
        </VerticalSpaceContainer>
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
