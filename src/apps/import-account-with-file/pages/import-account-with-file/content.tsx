import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  IllustrationContainer,
  SpacingSize
} from '@src/libs/layout';
import { Tag, Typography } from '@libs/ui';
import { isSafariBuild } from '@src/utils';

export function ImportAccountWithFileContentPage() {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <img
          src="assets/illustrations/secret-key.png"
          width={200}
          height={120}
          alt="secret key"
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Import account from secret key file</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Tag>
          <Trans t={t}>Imported</Trans>
        </Tag>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Please note, accounts imported with a file cannot be recovered using
            your Casper Wallet secret recovery phrase.
          </Trans>
        </Typography>
      </ParagraphContainer>
      {/* https://github.com/make-software/casper-wallet/issues/611 */}
      {isSafariBuild && (
        <ParagraphContainer top={SpacingSize.Small}>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              Important: After importing, private key files cannot be downloaded
              from Casper Wallet. Make sure to store a copy of your secret key
              file in a safe place.
            </Trans>
          </Typography>
        </ParagraphContainer>
      )}
    </ContentContainer>
  );
}
