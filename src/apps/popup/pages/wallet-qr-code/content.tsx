import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
  margin-top: 24px;
`;

interface WalletQrCodePageContentProps {
  qrStrings: string[];
}

export const WalletQrCodePageContent = ({
  qrStrings
}: WalletQrCodePageContentProps) => {
  const theme = useTheme();
  const [currentQrIndex, setCurrentQrIndex] = useState<number>(0);

  useEffect(() => {
    const int = setInterval(() => {
      setCurrentQrIndex(prev => {
        const next = prev + 1;

        if (next === qrStrings.length) {
          return 0;
        }

        return next;
      });
    }, 500);

    return () => clearInterval(int);
  }, [qrStrings.length]);

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
          value={qrStrings[currentQrIndex]}
          size={296}
          fgColor={theme.color.contentPrimary}
          bgColor={theme.color.backgroundPrimary}
          level={'H'}
        />
      </QRContainer>
    </ContentContainer>
  );
};
