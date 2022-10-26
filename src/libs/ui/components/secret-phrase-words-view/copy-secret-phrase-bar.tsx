import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { FlexRow } from '@src/libs/layout';
import { CopyToClipboard, SvgIcon, Typography } from '@src/libs/ui';

const CopySecretPhraseContainer = styled(FlexRow)`
  gap: 4px;
`;

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
        <CopySecretPhraseContainer>
          <SvgIcon
            src={
              isClicked
                ? 'assets/icons/checkbox-checked.svg'
                : 'assets/icons/copy.svg'
            }
            color={isClicked ? 'contentGreen' : 'contentBlue'}
          />
          <Typography
            type="captionMedium"
            color={isClicked ? 'contentGreen' : 'contentBlue'}
          >
            {isClicked
              ? t('Copied to clipboard for 1 min')
              : t('Copy secret phrase')}
          </Typography>
        </CopySecretPhraseContainer>
      )}
      valueToCopy={secretPhraseForCopy}
      automaticallyClearClipboard
    />
  );
}
