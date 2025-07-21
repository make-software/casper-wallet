import { IAppMarketingEvent } from 'casper-wallet-core';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { dismissAppEvent } from '@background/redux/app-events/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui/components';

const AppEventContainer = styled.div<{ eventId: number }>`
  display: flex;
  flex-direction: column;
  margin-top: 24px;
  padding: 14px 105px 14px 16px;
  height: 108px;
  background-image: ${({ eventId }) =>
    eventId === 1
      ? "url('../../../../assets/illustrations/cspr-2-banner.svg')"
      : eventId === 2
        ? "url('../../../../assets/illustrations/cspr-name-banner.svg')"
        : "url('../../../../assets/illustrations/cspr-event-banner.svg')"};
`;

const OpacityText = styled(Typography)`
  opacity: 0.8;
  margin-top: 2px;
`;

const ButtonsContainer = styled(AlignedFlexRow)`
  padding-top: 3px;
  margin-top: auto;
`;

const ActionButton = styled.a`
  padding: 0 10px;

  background-color: ${props => props.theme.color.contentOnFill};
  border-radius: ${props => props.theme.borderRadius.hundred}px;
  color: ${props => props.theme.color.contentAction};

  font-size: 12px;
  font-weight: 600;
  line-height: 24px;

  text-decoration: none;
`;

const DismissButton = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 24px;

  color: ${props => props.theme.color.contentOnFill};

  cursor: pointer;
`;

interface IAppEventBannerProps {
  activeMarketingEvent: IAppMarketingEvent;
}

export const AppEventBanner: React.FC<IAppEventBannerProps> = ({
  activeMarketingEvent
}) => {
  const { t } = useTranslation();

  const dismissPromotion = () => {
    dispatchToMainStore(dismissAppEvent(activeMarketingEvent.id));
  };

  const isCasper2event = activeMarketingEvent.id === 1;

  return (
    <AppEventContainer eventId={activeMarketingEvent.id}>
      <Typography
        type="subtitle"
        color="contentOnFill"
        fontSize={'1.6rem'}
        lineHeight={'2.2rem'}
        ellipsis
      >
        <Trans t={t}>
          {isCasper2event
            ? 'Casper 2.0 is live now'
            : activeMarketingEvent.name}
        </Trans>
      </Typography>
      <OpacityText type="listSubtext" color="contentOnFill" ellipsis>
        <Trans t={t}>
          {isCasper2event
            ? 'the Real-World-Ready Blockchain!'
            : activeMarketingEvent.description}
        </Trans>
      </OpacityText>
      <ButtonsContainer gap={SpacingSize.Medium}>
        <ActionButton href={activeMarketingEvent.url} target="_blank">
          <Trans t={t}>Learn more</Trans>
        </ActionButton>
        <DismissButton onClick={dismissPromotion}>
          <Trans t={t}>Dismiss</Trans>
        </DismissButton>
      </ButtonsContainer>
    </AppEventContainer>
  );
};
