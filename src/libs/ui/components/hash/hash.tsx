import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  ContentColor,
  CopyToClipboard,
  SvgIcon,
  SvgIconHover,
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
  withHoverAndCopy?: boolean;
  isHover?: boolean;
}

export function Hash({
  value,
  variant,
  withCopyOnClick,
  truncated,
  color,
  withTag,
  withHoverAndCopy,
  isHover
}: HashProps) {
  const { t } = useTranslation();

  const HashComponent = useMemo(
    () => (
      <>
        <Typography type={variant} color={color || 'contentSecondary'}>
          {truncated ? truncateKey(value) : value}
        </Typography>
        {withTag && (
          <Tag displayContext="accountList">{`${t('Imported')}`}</Tag>
        )}
      </>
    ),
    [color, truncated, value, variant, withTag, t]
  );

  if (withHoverAndCopy) {
    return (
      <HashContainer>
        <Typography type={variant} color={color || 'contentSecondary'}>
          {truncated ? truncateKey(value) : value}
        </Typography>
        <CopyToClipboard
          renderContent={({ isClicked }) => (
            <>
              {isClicked ? (
                <SvgIcon
                  color="contentGreen"
                  src="assets/icons/checkbox-checked.svg"
                  size={16}
                  marginLeft
                />
              ) : (
                isHover && (
                  <>
                    <SvgIconHover
                      src="assets/icons/copy_v2.svg"
                      color="contentTertiary"
                      hoverColor="contentBlue"
                      size={16}
                      marginLeft
                    />
                  </>
                )
              )}
            </>
          )}
          valueToCopy={value}
        />
        {withTag && (
          <Tag displayContext="accountList">{`${t('Imported')}`}</Tag>
        )}
      </HashContainer>
    );
  }

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
