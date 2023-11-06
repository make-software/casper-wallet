import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import { Button, Modal, SvgIcon, Typography } from '@libs/ui';
import {
  AlignedFlexRow,
  CenteredFlexColumn,
  FlexColumn,
  SpacingSize
} from '@libs/layout';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { NetworkSetting } from '@src/constants';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { useCasperToken } from '@src/hooks';

const ButtonContainer = styled(AlignedFlexRow)`
  cursor: pointer;

  padding: 14px 16px;
`;

const MoreButton = styled(CenteredFlexColumn)`
  cursor: pointer;

  padding: 0 16px;
`;

interface MoreButtonsModalProps {
  handleBuyWithCSPR: () => void;
}

export const MoreButtonsModal = ({
  handleBuyWithCSPR
}: MoreButtonsModalProps) => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const casperToken = useCasperToken();

  const network = useSelector(selectActiveNetworkSetting);

  return (
    <Modal
      placement="bottom"
      renderContent={() => (
        <FlexColumn>
          {network === NetworkSetting.Mainnet && (
            <ButtonContainer
              gap={SpacingSize.Large}
              onClick={handleBuyWithCSPR}
            >
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
            <Button circle>
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
            <Button circle>
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
            <Button circle>
              <SvgIcon src="assets/icons/delegate.svg" color="contentOnFill" />
            </Button>
            <Typography type="bodySemiBold">
              <Trans t={t}>Delegate</Trans>
            </Typography>
          </ButtonContainer>
          <ButtonContainer
            gap={SpacingSize.Large}
            onClick={() => navigate(RouterPath.Undelegate)}
          >
            <Button circle>
              <SvgIcon
                src="assets/icons/undelegate.svg"
                color="contentOnFill"
              />
            </Button>
            <Typography type="bodySemiBold">
              <Trans t={t}>Undelegate</Trans>
            </Typography>
          </ButtonContainer>
        </FlexColumn>
      )}
      children={() => (
        <MoreButton gap={SpacingSize.Small}>
          <Button circle>
            <SvgIcon
              src="assets/icons/more.svg"
              color="contentOnFill"
              style={{
                transform: 'rotate(90deg)'
              }}
            />
          </Button>
          <Typography type="captionMedium" color="contentAction">
            <Trans t={t}>More</Trans>
          </Typography>
        </MoreButton>
      )}
    />
  );
};
