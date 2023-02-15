import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { FlexRow } from '@src/libs/layout';
import { CopyToClipboard, SvgIcon, Typography } from '@src/libs/ui';

const CopySecretPhraseContainer = styled(FlexRow)`
  gap: 4px;
  align-items: center;
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
            size={isClicked ? 24 : 16}
            color={isClicked ? 'contentGreen' : 'contentBlue'}
          />
          <Typography
            type="captionMedium"
            color={isClicked ? 'contentGreen' : 'contentBlue'}
          >
            {isClicked
              ? t('Copied to clipboard')
              : t('Copy secret recovery phrase')}
          </Typography>
        </CopySecretPhraseContainer>
      )}
      valueToCopy={secretPhraseForCopy}
    />
  );
}
