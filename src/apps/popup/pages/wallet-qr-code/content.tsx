import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  CenteredFlexRow,
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { QrCode, Typography } from '@libs/ui/components';

// The symbol carries its own white quiet zone (see QrCode), so the card adds no
// padding of its own — the full content width goes to the symbol instead, which
// is what keeps the modules big enough to scan. The canvas covers the card
// edge to edge, so the card needs no background of its own either; `overflow`
// keeps the square canvas inside the rounded corners.
const QRContainer = styled(CenteredFlexRow)`
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
  margin-top: 24px;
`;

interface WalletQrCodePageContentProps {
  qrStrings: string[];
}

export const WalletQrCodePageContent = ({
  qrStrings
}: WalletQrCodePageContentProps) => {
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
        <QrCode value={qrStrings[currentQrIndex]} size={328} />
      </QRContainer>
    </ContentContainer>
  );
};
