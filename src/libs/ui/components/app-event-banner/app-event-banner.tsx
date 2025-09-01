import { IAppMarketingEvent } from 'casper-wallet-core';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';

import { dismissAppEvent } from '@background/redux/app-events/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

const bannerMap: Record<number, string> = {
  1: "url('../../../../assets/illustrations/cspr-2-banner.svg')",
  2: "url('../../../../assets/illustrations/cspr-name-banner.svg')"
};

type AppEventContainerProps = {
  eventId: number;
  bgImage?: string;
};

const sharedBannerStyles = css<AppEventContainerProps>`
  display: flex;
  flex-direction: column;
  margin-top: 24px;
  padding: 14px 105px 14px 16px;
  height: 108px;

  background-image: ${({ bgImage, eventId }) =>
    bgImage ??
    bannerMap[eventId] ??
    "url('../../../../assets/illustrations/cspr-event-banner.svg')"};
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
`;

const AppEventContainer = styled.div<AppEventContainerProps>`
  ${sharedBannerStyles}
`;

const AppEventLinkContainer = styled.a<AppEventContainerProps>`
  ${sharedBannerStyles};
  text-decoration: none;
  color: inherit;
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

const CaspyWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const CloseIconButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  background: ${({ theme }) => theme.color.backgroundSecondary ?? '#E0E0E0'};
  color: ${({ theme }) => theme.color.contentDisabled};

  outline: none;
  &:focus-visible {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color.contentOnFill}33;
  }
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
  const isCaspyEvent = activeMarketingEvent.id === 3;

  const bgImage = activeMarketingEvent?.image_url
    ? `url('${activeMarketingEvent.image_url}')`
    : undefined;

  if (isCaspyEvent) {
    return (
      <CaspyWrapper>
        <AppEventLinkContainer
          href={activeMarketingEvent?.url || '#'}
          target="_blank"
          rel="noreferrer noopener"
          eventId={activeMarketingEvent.id}
          bgImage={bgImage}
          aria-label={activeMarketingEvent?.name || 'Open promotion'}
        />
        <CloseIconButton
          type="button"
          aria-label={'dismiss'}
          title={'dismiss'}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            dismissPromotion();
          }}
        >
          <SvgIcon src="assets/icons/close.svg" size={15} />
        </CloseIconButton>
      </CaspyWrapper>
    );
  }

  return (
    <AppEventContainer eventId={activeMarketingEvent.id} bgImage={bgImage}>
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
        <ActionButton
          href={activeMarketingEvent.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          <Trans t={t}>Learn more</Trans>
        </ActionButton>

        <DismissButton onClick={dismissPromotion}>
          <Trans t={t}>Dismiss</Trans>
        </DismissButton>
      </ButtonsContainer>
    </AppEventContainer>
  );
};
