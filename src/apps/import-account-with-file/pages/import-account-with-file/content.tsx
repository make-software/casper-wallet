import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { isSafariBuild } from '@src/utils';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

export function ImportAccountWithFileContentPage() {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/import-secret-key.svg"
          width={200}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Import account from secret key file</Trans>
        </Typography>
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
