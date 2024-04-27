import { Player } from '@lottiefiles/react-lottie-player';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import dotsDarkModeAnimation from '@libs/animations/dots_dark_mode.json';
import dotsLightModeAnimation from '@libs/animations/dots_light_mode.json';
import { CenteredFlexColumn, FooterButtonsContainer } from '@libs/layout';
import {
  IsUsbLedgerTransportAvailable,
  LedgerTransport,
  subscribeToBluetoothAvailability
} from '@libs/services/ledger';
import { Button } from '@libs/ui/components';

interface ILedgerDisconnectedFooterProps {
  onConnect: (tr?: LedgerTransport) => () => Promise<void>;
}

export const LedgerDisconnectedFooter: React.FC<
  ILedgerDisconnectedFooterProps
> = ({ onConnect }) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();
  const [isPlayingLoading, setIsPlayingLoading] = useState(false);
  const [usbAvailable, setUsbAvailable] = useState(true);
  const [bluetoothAvailable, setBluetoothAvailable] = useState(true);

  useEffect(() => {
    IsUsbLedgerTransportAvailable().then(setUsbAvailable);
  }, []);

  useEffect(() => {
    const sub = subscribeToBluetoothAvailability(setBluetoothAvailable);

    return () => sub.unsubscribe();
  }, []);

  return (
    <FooterButtonsContainer>
      {isPlayingLoading ? (
        <CenteredFlexColumn>
          <Player
            renderer="svg"
            autoplay
            loop
            src={isDarkMode ? dotsDarkModeAnimation : dotsLightModeAnimation}
            style={{ height: '96px' }}
          />
        </CenteredFlexColumn>
      ) : (
        <>
          {usbAvailable && (
            <Button
              onClick={async () => {
                try {
                  setIsPlayingLoading(true);
                  await onConnect('USB')();
                } catch (er) {
                } finally {
                  setIsPlayingLoading(false);
                }
              }}
            >
              <Trans t={t}>Connect via USB</Trans>
            </Button>
          )}
          {bluetoothAvailable && (
            <Button
              color={'secondaryBlue'}
              onClick={async () => {
                try {
                  setIsPlayingLoading(true);
                  await onConnect('Bluetooth')();
                } catch (er) {
                } finally {
                  setIsPlayingLoading(false);
                }
              }}
            >
              <Trans t={t}>Connect via Bluetooth</Trans>
            </Button>
          )}
        </>
      )}
    </FooterButtonsContainer>
  );
};
