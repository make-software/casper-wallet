import React, { useState, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { ContentColor, SvgIcon, Typography } from '@libs/ui';

import { truncateKey } from './utils';

const HashContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'cursor')};
`;

const CopyStatusContainer = styled.div`
  display: flex;
  gap: 4px;

  cursor: auto;
`;

export enum HashVariant {
  CaptionHash = 'caption',
  BodyHash = 'body'
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
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isClicked) {
      timeout = setTimeout(() => {
        setIsClicked(false);
      }, 2000);
    }

    return () => timeout && clearTimeout(timeout);
  }, [isClicked, setIsClicked]);

  const handleCopyOnClick = withCopyOnClick
    ? () => {
        if (isClicked) {
          return;
        }

        setIsClicked(true);
        navigator.clipboard.writeText(value);
      }
    : undefined;

  return (
    <HashContainer onClick={handleCopyOnClick}>
      {isClicked ? (
        <CopyStatusContainer>
          <SvgIcon
            color="contentGreen"
            src="assets/icons/checkbox-checked.svg"
            size={24}
          />
          <Typography type="body" weight="regular" color="contentGreen">
            <Trans t={t}>Copied!</Trans>
          </Typography>
        </CopyStatusContainer>
      ) : (
        <>
          <Typography
            asHash
            type={variant}
            weight="regular"
            color={color || 'contentSecondary'}
          >
            {truncated ? truncateKey(value) : value}
          </Typography>
          {withCopyOnClick && <SvgIcon src="assets/icons/copy.svg" size={24} />}
        </>
      )}
    </HashContainer>
  );
}
