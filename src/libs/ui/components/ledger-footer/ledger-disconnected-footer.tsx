import { Player } from '@lottiefiles/react-lottie-player';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { dispatchToMainStore } from '@background/redux/utils';

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
  const searchParams = new URLSearchParams(document.location.search);
  const ledgerTransport = searchParams.get('ledgerTransport');

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
          {usbAvailable &&
            (ledgerTransport ? ledgerTransport === 'USB' : true) && (
              <Button
                onClick={async () => {
                  try {
                    setIsPlayingLoading(true);

                    if (!ledgerTransport) {
                      dispatchToMainStore(ledgerStateCleared());
                    }

                    await onConnect('USB')();
                  } catch (er) {
                  } finally {
                    setIsPlayingLoading(false);
                  }
                }}
              >
                <Trans t={t}>
                  {ledgerTransport ? 'Continue' : 'Connect via USB'}
                </Trans>
              </Button>
            )}
          {bluetoothAvailable &&
            (ledgerTransport ? ledgerTransport === 'Bluetooth' : true) && (
              <Button
                color={'secondaryBlue'}
                onClick={async () => {
                  try {
                    setIsPlayingLoading(true);

                    if (!ledgerTransport) {
                      dispatchToMainStore(ledgerStateCleared());
                    }

                    await onConnect('Bluetooth')();
                  } catch (er) {
                  } finally {
                    setIsPlayingLoading(false);
                  }
                }}
              >
                <Trans t={t}>
                  {ledgerTransport ? 'Continue' : 'Connect via Bluetooth'}
                </Trans>
              </Button>
            )}
        </>
      )}
    </FooterButtonsContainer>
  );
};
