import { CasperNetwork } from 'casper-wallet-core';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from 'typesafe-actions';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { dismissCsprNameExpirations } from '@background/redux/cspr-name-expirations/actions';
import { selectExpiringCsprNames } from '@background/redux/cspr-name-expirations/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui/components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 24px;
  padding: 14px 105px 14px 16px;
  height: 108px;

  background-image: url('../../../../assets/illustrations/cspr-name-banner.svg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
`;

const OpacityText = styled(Typography)`
  opacity: 0.8;
  margin-top: 2px;
`;

const ButtonsContainer = styled(AlignedFlexRow)`
  padding-top: 3px;
  margin-top: auto;
`;

const ActionButton = styled.div`
  padding: 0 10px;

  background-color: ${props => props.theme.color.contentOnFill};
  border-radius: ${props => props.theme.borderRadius.hundred}px;
  color: ${props => props.theme.color.contentAction};

  font-size: 12px;
  font-weight: 600;
  line-height: 24px;

  cursor: pointer;
`;

const DismissButton = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 24px;

  color: ${props => props.theme.color.contentOnFill};

  cursor: pointer;
`;

export const CsprNameExpirationBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const networkSetting = useSelector(selectActiveNetworkSetting);
  const network = networkSetting.toLowerCase() as CasperNetwork;
  const expiringNames = useSelector((state: RootState) =>
    selectExpiringCsprNames(state, network)
  );

  const handleDismiss = () => {
    dispatchToMainStore(
      dismissCsprNameExpirations({
        network,
        publicKeys: expiringNames.map(n => n.publicKey)
      })
    );
  };

  return (
    <Container>
      <Typography
        type="subtitle"
        color="contentOnFill"
        fontSize={'1.6rem'}
        lineHeight={'2.2rem'}
        ellipsis
      >
        <Trans t={t}>CSPR.name expiring soon</Trans>
      </Typography>

      <OpacityText type="listSubtext" color="contentOnFill" ellipsis>
        <Trans t={t}>Renew names for your accounts</Trans>
      </OpacityText>

      <ButtonsContainer gap={SpacingSize.Medium}>
        <ActionButton onClick={() => navigate(RouterPath.CsprNameExpirations)}>
          <Trans t={t}>View names</Trans>
        </ActionButton>

        <DismissButton onClick={handleDismiss}>
          <Trans t={t}>Dismiss</Trans>
        </DismissButton>
      </ButtonsContainer>
    </Container>
  );
};
