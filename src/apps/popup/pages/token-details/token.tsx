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
import { TokenType, useCasperToken, useErc20Tokens } from '@src/hooks';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import {
  getBlockExplorerAccountUrl,
  getBlockExplorerContractUrl
} from '@src/constants';
import { formatErc20TokenBalance } from '../home/components/tokens-list/utils';
import { ContractPackageWithBalance } from '@src/libs/services/erc20-service';

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

type TokenProps = {
  erc20TokensData: ContractPackageWithBalance[] | null;
};

export const Token = ({ erc20TokensData }: TokenProps) => {
  const [tokenData, setTokenData] = useState<TokenType | null>(null);
  const [tokenInfoList, setTokenInfoList] = useState<TokenInfoList[] | []>([]);
  const [hrefToTokenOnCasperLive, setHrefToTokenOnCasperLive] = useState<
    string | undefined
  >();

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { tokenName } = useParams();

  const casperToken = useCasperToken();
  const erc20Tokens = useErc20Tokens();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    if (tokenName === 'Casper') {
      // Casper Coin case
      if (casperToken && activeAccount) {
        setTokenData(casperToken);
        setTokenInfoList([
          { id: 1, name: 'Symbol', value: casperToken.symbol }
        ]);
        setHrefToTokenOnCasperLive(
          getBlockExplorerAccountUrl(casperLiveUrl, activeAccount.publicKey)
        );
      }
    } else {
      // ERC-20 token case
      const erc20TokensList = formatErc20TokenBalance(erc20Tokens);
      if (erc20TokensList == null) {
        return;
      }
      const token = erc20TokensList?.find(token => token.name === tokenName);
      if (token != null) {
        setTokenData(token);
        setTokenInfoList([{ id: 1, name: 'Symbol', value: token.symbol }]);
        setHrefToTokenOnCasperLive(
          getBlockExplorerContractUrl(casperLiveUrl, token.id)
        );
      }
    }
  }, [tokenName, casperToken, activeAccount, casperLiveUrl, erc20Tokens]);

  return (
    <List
      contentTop={SpacingSize.Small}
      rows={tokenInfoList}
      renderHeader={() => <TokenPlate token={tokenData} />}
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
