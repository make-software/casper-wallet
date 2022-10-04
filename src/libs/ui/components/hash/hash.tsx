import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { ContentColor, CopyToClipboard, SvgIcon, Typography } from '@libs/ui';
import { CenteredFlexRow } from '@libs/layout';

import { truncateKey } from './utils';

const HashContainer = styled(CenteredFlexRow)``;

const ClickableHashContainer = styled(HashContainer)`
  cursor: pointer;
`;

const CopyStatusContainer = styled.div`
  display: flex;
  gap: 4px;

  cursor: auto;
`;

export enum HashVariant {
  CaptionHash = 'captionHash',
  BodyHash = 'bodyHash'
}

interface HashProps {
  value: string;
  variant: HashVariant;
  truncated?: boolean;
  color?: ContentColor;
  withCopyOnClick?: boolean;
}

export function Hash({
  value,
  variant,
  withCopyOnClick,
  truncated,
  color
}: HashProps) {
  const { t } = useTranslation();

  const HashComponent = useMemo(
    () => (
      <Typography type={variant} color={color || 'contentSecondary'}>
        {truncated ? truncateKey(value) : value}
      </Typography>
    ),
    [color, truncated, value, variant]
  );

  if (withCopyOnClick) {
    return (
      <CopyToClipboard
        renderClickableComponent={() => (
          <ClickableHashContainer>
            {HashComponent}
            <SvgIcon src="assets/icons/copy.svg" size={24} />
          </ClickableHashContainer>
        )}
        renderStatusComponent={() => (
          <CopyStatusContainer>
            <SvgIcon
              color="contentGreen"
              src="assets/icons/checkbox-checked.svg"
              size={24}
            />
            <Typography type="body" color="contentGreen">
              <Trans t={t}>Copied!</Trans>
            </Typography>
          </CopyStatusContainer>
        )}
        valueToCopy={value}
      />
    );
  }
  return <HashContainer>{HashComponent}</HashContainer>;
}
