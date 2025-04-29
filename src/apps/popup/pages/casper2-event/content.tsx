// @ts-ignore
import ConfettiGenerator from 'confetti-js';
import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

export const WalletQrCodePageContent = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const confettiSettings = {
      target: 'confetti-holder',
      max: '25',
      size: '1',
      animate: true,
      props: ['circle', 'square'],
      colors: [
        [156, 178, 224],
        [96, 172, 138],
        [239, 79, 71],
        [255, 194, 72]
      ],
      clock: '30',
      rotate: false,
      start_from_edge: false,
      respawn: true
    };
    const confetti = new ConfettiGenerator(confettiSettings);
    confetti.render();

    return () => confetti.clear();
  }, []);

  return (
    <ContentContainer style={{ position: 'relative' }}>
      <canvas
        id="confetti-holder"
        style={{
          position: 'absolute',
          left: 0,
          width: 360,
          height: 400,
          top: -20,
          right: 0,
          bottom: 0
        }}
      ></canvas>
      <ParagraphContainer top={SpacingSize.Medium}>
        <SvgIcon
          src="assets/illustrations/casper-2-event.svg"
          width={296}
          height={120}
        />
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header" color="contentPrimary">
          <Trans t={t}>Congrats on the launch of Casper 2.0</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Casper 2.0, the biggest upgrade of @casper_network to date, is built
            for the real-world economy, securing asset ownership and sensitive
            data while delivering secure, upgradeable, and interoperable
            infrastructure for a more transparent and trusted digital future.
          </Trans>
        </Typography>
      </ParagraphContainer>
    </ContentContainer>
  );
};
