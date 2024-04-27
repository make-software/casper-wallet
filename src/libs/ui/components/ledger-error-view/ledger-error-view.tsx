import { Player } from '@lottiefiles/react-lottie-player';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import dotsDarkModeAnimation from '@libs/animations/dots_dark_mode.json';
import dotsLightModeAnimation from '@libs/animations/dots_light_mode.json';
import {
  CenteredFlexColumn,
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import {
  ILedgerEvent,
  LedgerEventStatus,
  ledgerErrorsData
} from '@libs/services/ledger';
import { SvgIcon, Typography } from '@libs/ui/components';

interface ILedgerErrorProps {
  event: ILedgerEvent;
}

export const LedgerErrorView: React.FC<ILedgerErrorProps> = ({ event }) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  const title = ledgerErrorsData[event.status]?.title;
  const description = ledgerErrorsData[event.status]?.description;

  const isRejectedIcon =
    event.status === LedgerEventStatus.CasperAppNotLoaded ||
    event.status === LedgerEventStatus.MsgSignatureCanceled ||
    event.status === LedgerEventStatus.SignatureCanceled;

  const withLoader =
    event.status === LedgerEventStatus.CasperAppNotLoaded ||
    event.status === LedgerEventStatus.DeviceLocked;

  if (!title) {
    return null;
  }

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src={
            isRejectedIcon
              ? 'assets/illustrations/ledger-rejected.svg'
              : 'assets/illustrations/ledger-error.svg'
          }
          width={296}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>{title}</Trans>
        </Typography>
      </ParagraphContainer>
      {description && (
        <ParagraphContainer top={SpacingSize.Medium}>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>{description}</Trans>
          </Typography>
        </ParagraphContainer>
      )}

      {withLoader && (
        <CenteredFlexColumn>
          <Player
            renderer="svg"
            autoplay
            loop
            src={isDarkMode ? dotsDarkModeAnimation : dotsLightModeAnimation}
            style={{ height: '130px' }}
          />
        </CenteredFlexColumn>
      )}
    </ContentContainer>
  );
};
