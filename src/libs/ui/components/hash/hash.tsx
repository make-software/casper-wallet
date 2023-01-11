import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  ContentColor,
  CopyToClipboard,
  SvgIcon,
  Typography,
  Tag
} from '@libs/ui';
import { CenteredFlexRow } from '@libs/layout';

import { truncateKey } from './utils';

const HashContainer = styled(CenteredFlexRow)``;

const CopyStatusContainer = styled.div`
  display: flex;
  gap: 4px;
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
  withTag?: boolean;
}

export function Hash({
  value,
  variant,
  withCopyOnClick,
  truncated,
  color,
  withTag
}: HashProps) {
  const { t } = useTranslation();

  const HashComponent = useMemo(
    () => (
      <>
        <Typography type={variant} color={color || 'contentSecondary'}>
          {truncated ? truncateKey(value) : value}
        </Typography>
        {withTag && <Tag margin="0 0 0 4px">{`${t('Imported')}`}</Tag>}
      </>
    ),
    [color, truncated, value, variant, withTag]
  );

  if (withCopyOnClick) {
    return (
      <CopyToClipboard
        renderContent={({ isClicked }) => (
          <>
            {isClicked ? (
              <CopyStatusContainer>
                <SvgIcon
                  color="contentGreen"
                  src="assets/icons/checkbox-checked.svg"
                />
                <Typography type="body" color="contentGreen">
                  <Trans t={t}>Copied!</Trans>
                </Typography>
              </CopyStatusContainer>
            ) : (
              <>
                {HashComponent}
                <SvgIcon src="assets/icons/copy.svg" />
              </>
            )}
          </>
        )}
        valueToCopy={value}
      />
    );
  }
  return <HashContainer>{HashComponent}</HashContainer>;
}
