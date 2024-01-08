import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui';

const ErrorContainer = styled(FlexColumn)`
  padding: 12px 16px;

  background: ${({ theme }) => theme.color.backgroundPrimary};
`;

interface ErrorProps {
  header: string;
  description: string;
}

export const Error = ({ header, description }: ErrorProps) => {
  const { t } = useTranslation();

  return (
    <ErrorContainer gap={SpacingSize.Small}>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <SvgIcon
          src="assets/icons/error.svg"
          size={24}
          color="contentActionCritical"
        />
        <Typography type="bodySemiBold">
          <Trans t={t}>{header}</Trans>
        </Typography>
      </AlignedFlexRow>
      <Typography type="captionRegular" color="contentSecondary">
        <Trans t={t}> {description}</Trans>
      </Typography>
    </ErrorContainer>
  );
};
