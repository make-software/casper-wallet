import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  ContentContainer,
  FlexColumn,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Button, Tile, Typography, ActiveAccountPlate } from '@libs/ui';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { useCopyToClipboard } from '@src/hooks';

const Container = styled.div`
  padding: 16px;
`;

export const ReceivePageContent = () => {
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);

  const { handleCopyOnClick } = useCopyToClipboard(
    activeAccount?.publicKey || ''
  );

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Receive tokens</Trans>
        </Typography>
      </ParagraphContainer>
      <ActiveAccountPlate label="To account" />
      <VerticalSpaceContainer top={SpacingSize.XXXL}>
        <Tile>
          <Container>
            <FlexColumn gap={SpacingSize.Medium}>
              <Typography
                type="captionHash"
                color="contentSecondary"
                overflowWrap
              >
                {activeAccount?.publicKey}
              </Typography>
              <Button color="secondaryBlue" onClick={handleCopyOnClick}>
                <Trans t={t}>Copy account hash</Trans>
              </Button>
            </FlexColumn>
          </Container>
        </Tile>
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
