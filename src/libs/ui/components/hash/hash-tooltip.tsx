import React from 'react';
import { useTranslation } from 'react-i18next';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

import { CopyToClipboardComponent } from '../copy-to-clipboard-component/copy-to-clipboard-component';

interface HashTooltipProps {
  hash: string;
  hashLabel?: string;
  csprName?: string | null;
  ownerName?: string;
  contractName?: string;
}

export const HashTooltip: React.FC<HashTooltipProps> = ({
  hash,
  hashLabel,
  ownerName,
  csprName,
  contractName
}) => {
  const { t } = useTranslation();

  return (
    <FlexColumn gap={SpacingSize.Small}>
      <FlexColumn gap={SpacingSize.Tiny}>
        <Typography type="listSubtext" color="contentSecondary">
          {hashLabel}
        </Typography>
        <AlignedFlexRow gap={SpacingSize.Tiny}>
          <Typography
            type="bodyHash"
            color="contentPrimary"
            style={{ maxWidth: '312px', wordBreak: 'break-word' }}
          >
            {hash}
          </Typography>
          <CopyToClipboardComponent
            enabled
            withCopyIcon
            valueToCopy={hash || ''}
            copiedElement={
              <SvgIcon
                src="assets/icons/tick.svg"
                color={'contentPositive'}
                size={16}
              />
            }
          >
            <SvgIcon
              src="assets/icons/copy.svg"
              color="contentDisabled"
              size={16}
            />
          </CopyToClipboardComponent>
        </AlignedFlexRow>
      </FlexColumn>

      {contractName && (
        <FlexColumn gap={SpacingSize.Tiny}>
          <Typography type="listSubtext" color="contentSecondary">
            {t('Contract name')}
          </Typography>
          <Typography
            type="body"
            color="contentPrimary"
            overflowWrap
            style={{ maxWidth: '312px' }}
          >
            {contractName}
          </Typography>
        </FlexColumn>
      )}

      {csprName && (
        <FlexColumn gap={SpacingSize.Tiny}>
          <Typography type="listSubtext" color="contentSecondary">
            {t('CSPR.name')}
          </Typography>
          <Typography
            type="body"
            color="contentPrimary"
            overflowWrap
            style={{ maxWidth: '312px' }}
          >
            {csprName}
          </Typography>
        </FlexColumn>
      )}

      {ownerName && (
        <FlexColumn gap={SpacingSize.Tiny}>
          <Typography type="listSubtext" color="contentSecondary">
            {t('Owner name')}
          </Typography>
          <Typography
            type="body"
            color="contentPrimary"
            overflowWrap
            style={{ maxWidth: '312px' }}
          >
            {ownerName}
          </Typography>
        </FlexColumn>
      )}
    </FlexColumn>
  );
};
