import React from 'react';
import { useTranslation } from 'react-i18next';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { CopyToClipboard, SvgIcon, Typography } from '@libs/ui/components';

interface CopySecretPhraseBarProps {
  secretPhraseForCopy: string;
}

export function CopySecretPhraseBar({
  secretPhraseForCopy
}: CopySecretPhraseBarProps) {
  const { t } = useTranslation();
  return (
    <CopyToClipboard
      renderContent={({ isClicked }) => (
        <AlignedFlexRow gap={SpacingSize.Tiny}>
          <SvgIcon
            src={
              isClicked
                ? 'assets/icons/radio-button-on.svg'
                : 'assets/icons/copy.svg'
            }
            size={isClicked ? 24 : 16}
            color={isClicked ? 'contentPositive' : 'contentAction'}
          />
          <Typography
            type="captionMedium"
            color={isClicked ? 'contentPositive' : 'contentAction'}
          >
            {isClicked
              ? t('Copied to clipboard')
              : t('Copy secret recovery phrase')}
          </Typography>
        </AlignedFlexRow>
      )}
      valueToCopy={secretPhraseForCopy}
    />
  );
}
