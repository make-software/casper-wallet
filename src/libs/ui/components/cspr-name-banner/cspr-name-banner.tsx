import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { setShowCSPRNamePromotion } from '@background/redux/promotion/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';

const Container = styled.div`
  margin-top: 24px;
  height: 108px;
  background-image: url('../../../../assets/illustrations/cspr-name-banner.svg');
`;

const ButtonsContainer = styled(AlignedFlexRow)`
  padding-top: 68px;
  padding-left: 16px;
`;

const WhiteButton = styled.a`
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

export const CsprNameBanner = () => {
  const { t } = useTranslation();

  const dismissPromotion = () => {
    dispatchToMainStore(setShowCSPRNamePromotion(false));
  };

  return (
    <Container>
      <ButtonsContainer gap={SpacingSize.Medium}>
        {/* TODO: add url to CSPR.name */}
        <WhiteButton href="" target="_blank">
          <Trans t={t}>Get it now</Trans>
        </WhiteButton>
        <DismissButton onClick={dismissPromotion}>
          <Trans t={t}>Dismiss</Trans>
        </DismissButton>
      </ButtonsContainer>
    </Container>
  );
};
