import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  ContentColor,
  CopyToClipboard,
  SvgIcon,
  Typography,
  Tag,
  SvgIconHover
} from '@libs/ui';
import { CenteredFlexRow } from '@libs/layout';

import { truncateKey } from './utils';

interface HashContainerProps {
  displayContext?: 'home';
}

const HashContainer = styled(CenteredFlexRow)<HashContainerProps>`
  display: flex;
  align-items: center;
  height: ${({ displayContext }) =>
    displayContext === 'home' ? '24px' : 'auto'};
`;

const CopyStatusContainer = styled.div`
  display: flex;
  gap: 4px;
`;

export const HoverIcon = styled(SvgIconHover)`
  display: none;
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
  withCopyOnSelfClick?: boolean;
  withTag?: boolean;
  withCopyIconOnHover?: boolean;
  displayContext?: 'home';
}

export function Hash({
  value,
  variant,
  withCopyOnSelfClick,
  truncated,
  color,
  withTag,
  withCopyIconOnHover,
  displayContext
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

  if (withCopyIconOnHover) {
    return (
      <HashContainer displayContext={displayContext}>
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
                <HoverIcon
                  src="assets/icons/copy.svg"
                  color="contentTertiary"
                  hoverColor="contentBlue"
                  size={16}
                  marginLeft
                />
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

  if (withCopyOnSelfClick) {
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
              <HashContainer displayContext={displayContext}>
                {HashComponent}
                <SvgIcon src="assets/icons/copy.svg" size={16} marginLeft />
              </HashContainer>
            )}
          </>
        )}
        valueToCopy={value}
      />
    );
  }
  return (
    <HashContainer displayContext={displayContext}>
      {HashComponent}
    </HashContainer>
  );
}
