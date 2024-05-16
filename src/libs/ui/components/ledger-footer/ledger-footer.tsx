import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { FooterButtonsContainer } from '@libs/layout';
import {
  ILedgerEvent,
  LedgerEventStatus,
  LedgerTransport,
  isLedgerError
} from '@libs/services/ledger';
import { Button } from '@libs/ui/components';

import { LedgerDisconnectedFooter } from './ledger-disconnected-footer';

interface IRenderLedgerFooterParams {
  event: ILedgerEvent;
  onErrorCtaPressed: () => void;
  onConnect: (tr?: LedgerTransport) => () => Promise<void>;
}

export const renderLedgerFooter = ({
  event,
  onErrorCtaPressed,
  onConnect
}: IRenderLedgerFooterParams) => {
  if (
    event?.status === LedgerEventStatus.Disconnected ||
    event?.status === LedgerEventStatus.LedgerAskPermission
  ) {
    return () => <LedgerDisconnectedFooter onConnect={onConnect} />;
  } else if (isLedgerError(event)) {
    return () => <LedgerErrorFooter onErrorCtaPressed={onErrorCtaPressed} />;
  }

  return undefined;
};

export const LedgerErrorFooter: React.FC<
  Pick<IRenderLedgerFooterParams, 'onErrorCtaPressed'>
> = ({ onErrorCtaPressed }) => {
  const { t } = useTranslation();

  return (
    <FooterButtonsContainer>
      <Button onClick={onErrorCtaPressed}>
        <Trans t={t}>Got it</Trans>
      </Button>
    </FooterButtonsContainer>
  );
};
