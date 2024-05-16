import { Player } from '@lottiefiles/react-lottie-player';
import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { ledgerSupportLink } from '@src/constants';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import dotsDarkModeAnimation from '@libs/animations/dots_dark_mode.json';
import dotsLightModeAnimation from '@libs/animations/dots_light_mode.json';
import {
  AlignedFlexRow,
  CenteredFlexColumn,
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { ILedgerEvent, LedgerEventStatus } from '@libs/services/ledger';
import { Link, List, SvgIcon, Typography } from '@libs/ui/components';

const ItemContainer = styled(AlignedFlexRow)`
  padding: 16px;
`;

const steps = [
  {
    id: 1,
    text: 'Plug in your Ledger to the device'
  },
  {
    id: 2,
    text: 'Open Casper app on your Ledger'
  },
  {
    id: 3,
    text: 'Get back here to see txn details'
  }
];

interface INoConnectedLedgerProps {
  event?: ILedgerEvent;
}

export const NoConnectedLedger: React.FC<INoConnectedLedgerProps> = ({
  event
}) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    container?.scrollTo(0, 0);
  }, []);

  if (
    !(
      event?.status === LedgerEventStatus.Disconnected ||
      event?.status === LedgerEventStatus.WaitingResponseFromDevice ||
      event?.status === LedgerEventStatus.LedgerAskPermission
    )
  ) {
    return null;
  }

  return (
    <ContentContainer>
      <IllustrationContainer>
        {event.status === LedgerEventStatus.WaitingResponseFromDevice ? (
          <SvgIcon
            src="assets/illustrations/ledger-not-connected.svg"
            width={296}
            height={120}
          />
        ) : (
          <SvgIcon
            src="assets/illustrations/ledger-connect.svg"
            width={296}
            height={120}
          />
        )}
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          {event.status === LedgerEventStatus.WaitingResponseFromDevice && (
            <Trans t={t}>Ledger is connecting</Trans>
          )}
          {event.status === LedgerEventStatus.Disconnected && (
            <Trans t={t}>Open the Casper app on your Ledger device</Trans>
          )}
          {event.status === LedgerEventStatus.LedgerAskPermission && (
            <Trans t={t}>
              Now please provide permission to connect Ledger device
            </Trans>
          )}
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        {event.status === LedgerEventStatus.WaitingResponseFromDevice && (
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              Follow the steps to be able to [Sign/Confirm] transaction with
              Ledger.
            </Trans>
          </Typography>
        )}
        {event.status === LedgerEventStatus.Disconnected && (
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>to connect with Casper Wallet.</Trans>{' '}
            <Link
              color="contentAction"
              target="_blank"
              href={ledgerSupportLink}
              title={t('Learn more about Ledger')}
            >
              <Trans t={t}>Learn more about Ledger</Trans>
            </Link>
          </Typography>
        )}
      </ParagraphContainer>

      {event.status === LedgerEventStatus.WaitingResponseFromDevice && (
        <List
          rows={steps}
          renderRow={({ text }) => (
            <ItemContainer gap={SpacingSize.Large}>
              <SvgIcon src="assets/icons/radio-button-on.svg" />
              <Typography type="body">
                <Trans t={t}>{text}</Trans>
              </Typography>
            </ItemContainer>
          )}
          marginLeftForItemSeparatorLine={56}
        />
      )}

      {event.status === LedgerEventStatus.WaitingResponseFromDevice && (
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
