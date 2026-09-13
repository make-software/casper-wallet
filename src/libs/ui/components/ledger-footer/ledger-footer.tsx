import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { FooterButtonsContainer } from '@libs/layout';
import {
  ILedgerEvent,
  LedgerEventStatus,
  LedgerTransport,
  isLedgerError,
  isLedgerWaiting
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
  } else if (isLedgerWaiting(event)) {
    return () => <LedgerWaitingFooter onErrorCtaPressed={onErrorCtaPressed} />;
  } else if (isLedgerError(event)) {
    return () => <LedgerErrorFooter onErrorCtaPressed={onErrorCtaPressed} />;
  }

  return undefined;
};

/**
 * The flow behind this screen is still live and resumes on its own, so the button is the way
 * out of it rather than an acknowledgement.
 */
const LedgerWaitingFooter: React.FC<
  Pick<IRenderLedgerFooterParams, 'onErrorCtaPressed'>
> = ({ onErrorCtaPressed }) => {
  const { t } = useTranslation();

  return (
    <FooterButtonsContainer>
      <Button color="secondaryBlue" onClick={onErrorCtaPressed}>
        <Trans t={t}>Cancel and start over</Trans>
      </Button>
    </FooterButtonsContainer>
  );
};

const LedgerErrorFooter: React.FC<
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
