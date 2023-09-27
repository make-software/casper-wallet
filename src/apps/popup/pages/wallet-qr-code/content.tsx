import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import styled, { useTheme } from 'styled-components';

import {
  CenteredFlexRow,
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Typography } from '@libs/ui';

const QRContainer = styled(CenteredFlexRow)`
  padding: 20px 16px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
  margin-top: 20px;
`;

interface WalletQrCodePageContentProps {
  qrString: string;
}

export const WalletQrCodePageContent = ({
  qrString
}: WalletQrCodePageContentProps) => {
  const theme = useTheme();

  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>QR code is ready!</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body">
          <Trans t={t}>Scan this with your Casper Wallet app.</Trans>
        </Typography>
      </ParagraphContainer>
      <QRContainer>
        <QRCodeCanvas
          id="qrCode"
          value={qrString}
          size={296}
          bgColor={theme.color.backgroundPrimary}
          level={'H'}
        />
      </QRContainer>
    </ContentContainer>
  );
};
