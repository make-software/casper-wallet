import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  CenteredFlexColumn,
  CenteredFlexRow,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { Link, List, SvgIcon, TokenPlate, Typography } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { TokenType, useCasperToken } from '@src/hooks';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { getBlockExplorerAccountUrl } from '@src/constants';

const ListItemContainer = styled(SpaceBetweenFlexRow)`
  padding: 16px;
`;

const FooterItemContainer = styled(CenteredFlexRow)`
  padding: 24px 0 16px;
`;

const IconCircleContainer = styled(CenteredFlexRow)`
  height: 48px;
  width: 48px;

  margin: 0 16px;

  background-color: ${({ theme }) => theme.color.fillBlue};
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;

const SendButtonContainer = styled(CenteredFlexColumn)`
  cursor: pointer;
`;

type TokenInfoList = {
  id: number;
  name: string;
  value: string;
};

export const Token = () => {
  const [token, setToken] = useState<TokenType | null>(null);
  const [tokenInfoList, setTokenInfoList] = useState<TokenInfoList[] | []>([]);
  const [hrefToTokenOnCasperLive, setHrefToTokenOnCasperLive] = useState<
    string | undefined
  >();

  const { t } = useTranslation();
  const { tokenName } = useParams();
  const casperToken = useCasperToken();
  const navigate = useTypedNavigate();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    // TODO: update token, token info list and href for ERC20 tokens
    if (tokenName === 'Casper') {
      if (casperToken && activeAccount) {
        setToken(casperToken);
        setTokenInfoList([
          { id: 1, name: 'Symbol', value: casperToken.symbol }
        ]);
        setHrefToTokenOnCasperLive(
          getBlockExplorerAccountUrl(casperLiveUrl, activeAccount.publicKey)
        );
      }
    }
  }, [tokenName, casperToken, activeAccount, casperLiveUrl]);

  return (
    <List
      contentTop={SpacingSize.Small}
      rows={tokenInfoList}
      renderHeader={() => <TokenPlate token={token} />}
      renderRow={({ name, value }) => (
        <ListItemContainer>
          <Typography type="captionRegular" color="contentSecondary">
            {name}
          </Typography>
          <Typography type="captionRegular">{value}</Typography>
        </ListItemContainer>
      )}
      renderFooter={() => (
        <FooterItemContainer gap={SpacingSize.XXXL}>
          <SendButtonContainer
            gap={SpacingSize.Medium}
            onClick={() => navigate(RouterPath.Transfer)}
          >
            <IconCircleContainer>
              <SvgIcon src="assets/icons/transfer.svg" color="contentOnFill" />
            </IconCircleContainer>
            <Typography type="captionMedium" color="contentBlue">
              <Trans t={t}>Send</Trans>
            </Typography>
          </SendButtonContainer>
          <Link color="inherit" target="_blank" href={hrefToTokenOnCasperLive}>
            <CenteredFlexColumn gap={SpacingSize.Medium}>
              <IconCircleContainer>
                <SvgIcon
                  src="assets/icons/external-link.svg"
                  color="contentOnFill"
                />
              </IconCircleContainer>
              <Typography type="captionMedium" color="contentBlue">
                CSPR.live
              </Typography>
            </CenteredFlexColumn>
          </Link>
        </FooterItemContainer>
      )}
      marginLeftForItemSeparatorLine={16}
      marginLeftForHeaderSeparatorLine={64}
    />
  );
};
