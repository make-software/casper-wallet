import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { NetworkSetting } from '@src/constants';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';

import { useCasperToken } from '@hooks/use-casper-token';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { Button, SvgIcon, Typography } from '@libs/ui/components';

const ButtonContainer = styled(AlignedFlexRow)`
  cursor: pointer;

  padding: 14px 16px;
`;

interface ButtonsProps {
  handleBuyWithCSPR: () => void;
}

export const ModalButtons = ({ handleBuyWithCSPR }: ButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const casperToken = useCasperToken();

  const network = useSelector(selectActiveNetworkSetting);

  return (
    <FlexColumn>
      {network === NetworkSetting.Mainnet && (
        <ButtonContainer gap={SpacingSize.Large} onClick={handleBuyWithCSPR}>
          <Button circle>
            <SvgIcon src="assets/icons/card.svg" color="contentOnFill" />
          </Button>
          <FlexColumn>
            <Typography type="bodySemiBold">
              <Trans t={t}>Buy</Trans>
            </Typography>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Buy CSPR with cash</Trans>
            </Typography>
          </FlexColumn>
        </ButtonContainer>
      )}
      <ButtonContainer
        gap={SpacingSize.Large}
        onClick={() =>
          navigate(
            casperToken?.id
              ? RouterPath.Transfer.replace(
                  ':tokenContractPackageHash',
                  casperToken.id
                ).replace(
                  ':tokenContractHash',
                  casperToken.contractHash || 'null'
                )
              : RouterPath.TransferNoParams
          )
        }
      >
        <Button circle style={{ padding: '8px' }}>
          <SvgIcon src="assets/icons/transfer.svg" color="contentOnFill" />
        </Button>
        <FlexColumn>
          <Typography type="bodySemiBold">
            <Trans t={t}>Send</Trans>
          </Typography>
          <Typography type="captionRegular" color="contentSecondary">
            <Trans t={t}>Send CSPR to any account</Trans>
          </Typography>
        </FlexColumn>
      </ButtonContainer>
      <ButtonContainer
        gap={SpacingSize.Large}
        onClick={() =>
          navigate(RouterPath.Receive, {
            state: { tokenData: casperToken }
          })
        }
      >
        <Button circle style={{ padding: '8px' }}>
          <SvgIcon src="assets/icons/receive.svg" color="contentOnFill" />
        </Button>
        <FlexColumn>
          <Typography type="bodySemiBold">
            <Trans t={t}>Receive</Trans>
          </Typography>
          <Typography type="captionRegular" color="contentSecondary">
            <Trans t={t}>Receive CSPR</Trans>
          </Typography>
        </FlexColumn>
      </ButtonContainer>
      <ButtonContainer
        gap={SpacingSize.Large}
        onClick={() => navigate(RouterPath.Delegate)}
      >
        <Button circle style={{ padding: '8px' }}>
          <SvgIcon src="assets/icons/delegate.svg" color="contentOnFill" />
        </Button>
        <FlexColumn>
          <Typography type="bodySemiBold">
            <Trans t={t}>Delegate</Trans>
          </Typography>
          <Typography type="captionRegular" color="contentSecondary">
            <Trans t={t}>Stake CSPR to validator</Trans>
          </Typography>
        </FlexColumn>
      </ButtonContainer>
      <ButtonContainer
        gap={SpacingSize.Large}
        onClick={() => navigate(RouterPath.Undelegate)}
      >
        <Button circle style={{ padding: '8px' }}>
          <SvgIcon src="assets/icons/undelegate.svg" color="contentOnFill" />
        </Button>
        <FlexColumn>
          <Typography type="bodySemiBold">
            <Trans t={t}>Undelegate</Trans>
          </Typography>
          <Typography type="captionRegular" color="contentSecondary">
            <Trans t={t}>Remove your stake</Trans>
          </Typography>
        </FlexColumn>
      </ButtonContainer>
      <ButtonContainer
        gap={SpacingSize.Large}
        onClick={() => navigate(RouterPath.Redelegate)}
      >
        <Button circle style={{ padding: '8px' }}>
          <SvgIcon src="assets/icons/redelegate.svg" color="contentOnFill" />
        </Button>
        <FlexColumn>
          <Typography type="bodySemiBold">
            <Trans t={t}>Redelegate</Trans>
          </Typography>
          <Typography type="captionRegular" color="contentSecondary">
            <Trans t={t}>Move your stake</Trans>
          </Typography>
        </FlexColumn>
      </ButtonContainer>
    </FlexColumn>
  );
};
