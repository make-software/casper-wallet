import React from 'react';
import styled from 'styled-components';

// Deep paths, not the '@libs/layout' / '@libs/ui/components' barrels — see
// token-selector-row.tsx for why that barrel is unsafe in this file's
// render-tested, node-only jest tree.
import {
  AlignedFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout/containers';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';
import { Typography } from '@libs/ui/components/typography/typography';
import { Color } from '@libs/ui/utils/get-color-from-theme';

type SwapBannerVariant = 'warning' | 'error';

const ICON_COLOR: Record<SwapBannerVariant, Color> = {
  warning: 'contentWarning',
  error: 'contentActionCritical'
};

// Severity reads from the icon colour, not a tinted background — the same shape as the
// warning tile in `connect-another-account`. A tint would need a theme token that does not
// exist, and hardcoding one is illegible in dark mode.
const Container = styled(FlexColumn)`
  padding: 12px 16px;
  gap: 8px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

export interface SwapBannerProps {
  variant: SwapBannerVariant;
  icon?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
}

export const SwapBanner = ({ variant, icon, title, body }: SwapBannerProps) => (
  <Container>
    <AlignedFlexRow gap={SpacingSize.Tiny}>
      {icon != null && (
        <SvgIcon src={icon} color={ICON_COLOR[variant]} size={24} />
      )}
      <Typography type="bodySemiBold">{title}</Typography>
    </AlignedFlexRow>
    {body != null && (
      <Typography type="captionRegular" color="contentSecondary">
        {body}
      </Typography>
    )}
  </Container>
);
