import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';

import {
  ContentContainer,
  FlexColumn,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Tile, Typography, ActiveAccountPlate } from '@libs/ui';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { useCopyToClipboard } from '@src/hooks';
import { useTypedLocation } from '@popup/router';

const Container = styled.div`
  padding: 20px 16px;
`;

const HashContainer = styled.div`
  cursor: pointer;

  &:hover span {
    color: ${({ theme }) => theme.color.contentBlue};
  }
`;

export const ReceivePageContent = () => {
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);

  const { handleCopyOnClick, isClicked } = useCopyToClipboard(
    activeAccount?.publicKey || ''
  );

  const location = useTypedLocation();
  const { tokenData } = location?.state;

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Receive tokens</Trans>
        </Typography>
      </ParagraphContainer>
      <ActiveAccountPlate
        label="To account"
        symbol={tokenData?.symbol || ''}
        balance={tokenData?.amount || ''}
      />
      <VerticalSpaceContainer top={SpacingSize.XXXL}>
        <Tile>
          <Container>
            <FlexColumn gap={SpacingSize.Medium}>
              <QRCodeSVG
                value={activeAccount?.publicKey || ''}
                style={{
                  maxWidth: '296px',
                  maxHeight: '296px',
                  height: 'auto',
                  width: 'auto'
                }}
              />
              {isClicked ? (
                <Typography type="captionHash" color="contentGreen">
                  <Trans t={t}>Address copied!</Trans>
                </Typography>
              ) : (
                <HashContainer onClick={handleCopyOnClick}>
                  <Typography
                    type="captionHash"
                    color="contentPrimary"
                    overflowWrap
                  >
                    {activeAccount?.publicKey}
                  </Typography>
                </HashContainer>
              )}
            </FlexColumn>
          </Container>
        </Tile>
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
