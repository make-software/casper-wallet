import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { NetworkSetting, getBuyWithTopperUrl } from '@src/constants';

import { formatErc20TokenBalance } from '@popup/pages/home/components/tokens-list/utils';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import {
  selectActiveNetworkSetting,
  selectApiConfigBasedOnActiveNetwork
} from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { TokenType, useCasperToken } from '@hooks/use-casper-token';

import {
  CenteredFlexColumn,
  CenteredFlexRow,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { ContractPackageWithBalance } from '@libs/services/erc20-service';
import {
  Button,
  Link,
  List,
  SvgIcon,
  TokenPlate,
  Typography
} from '@libs/ui/components';

const ListItemContainer = styled(SpaceBetweenFlexRow)`
  padding: 16px;
`;

const FooterItemContainer = styled(CenteredFlexRow)`
  padding: 24px 0 16px;
`;

const ButtonContainer = styled(CenteredFlexColumn)`
  cursor: pointer;

  padding: 0 16px;
`;

type TokenInfoList = {
  id: number;
  name: string;
  value: string;
};

type TokenProps = {
  erc20Tokens: ContractPackageWithBalance[] | null;
};

export const Token = ({ erc20Tokens }: TokenProps) => {
  const location = useTypedLocation();
  const [tokenData, setTokenData] = useState<TokenType | null>(
    location.state.tokenData ?? null
  );
  const [tokenInfoList, setTokenInfoList] = useState<TokenInfoList[] | []>([]);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { tokenName } = useParams();
  const casperToken = useCasperToken();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);

  useEffect(() => {
    if (tokenName === 'Casper') {
      // Casper Coin case
      if (casperToken && activeAccount) {
        setTokenData(casperToken);
        setTokenInfoList([
          { id: 1, name: 'Symbol', value: casperToken?.symbol }
        ]);
      }
    } else {
      // ERC-20 token case
      const erc20TokensList = formatErc20TokenBalance(erc20Tokens);

      const token = erc20TokensList?.find(token => token.id === tokenName);

      if (token) {
        setTokenData(token);
        setTokenInfoList([
          { id: 1, name: 'Symbol', value: token?.symbol },
          { id: 2, name: 'Decimals', value: (token?.decimals || 0).toString() }
        ]);
      } else {
        setTokenData(prev => (prev ? { ...prev, amount: '0' } : null));
        setTokenInfoList([
          { id: 1, name: 'Symbol', value: tokenData?.symbol ?? '' },
          {
            id: 2,
            name: 'Decimals',
            value: (tokenData?.decimals || 0).toString()
          }
        ]);
      }
    }
  }, [
    tokenName,
    casperToken,
    activeAccount,
    casperLiveUrl,
    erc20Tokens,
    tokenData?.symbol,
    tokenData?.decimals
  ]);

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
          <ButtonContainer
            gap={SpacingSize.Medium}
            onClick={() =>
              navigate(
                tokenData?.id
                  ? RouterPath.Transfer.replace(
                      ':tokenContractPackageHash',
                      tokenData.id
                    ).replace(
                      ':tokenContractHash',
                      tokenData.contractHash || 'null'
                    )
                  : RouterPath.TransferNoParams,
                { state: { tokenData } }
              )
            }
          >
            <Button circle>
              <SvgIcon src="assets/icons/transfer.svg" color="contentOnFill" />
            </Button>
            <Typography type="captionMedium" color="contentAction">
              <Trans t={t}>Send</Trans>
            </Typography>
          </ButtonContainer>
          <ButtonContainer
            gap={SpacingSize.Medium}
            onClick={() =>
              navigate(RouterPath.Receive, { state: { tokenData } })
            }
          >
            <Button circle>
              <SvgIcon src="assets/icons/receive.svg" color="contentOnFill" />
            </Button>
            <Typography type="captionMedium" color="contentAction">
              <Trans t={t}>Receive</Trans>
            </Typography>
          </ButtonContainer>
          {tokenName === 'Casper' &&
            network === NetworkSetting.Mainnet &&
            activeAccount?.publicKey && (
              <Link
                color="inherit"
                target="_blank"
                href={getBuyWithTopperUrl(activeAccount.publicKey)}
              >
                <ButtonContainer gap={SpacingSize.Medium}>
                  <Button circle>
                    <SvgIcon
                      src="assets/icons/card.svg"
                      color="contentOnFill"
                    />
                  </Button>
                  <Typography type="captionMedium" color="contentAction">
                    <Trans t={t}>Buy</Trans>
                  </Typography>
                </ButtonContainer>
              </Link>
            )}
        </FooterItemContainer>
      )}
      marginLeftForItemSeparatorLine={16}
      marginLeftForHeaderSeparatorLine={64}
    />
  );
};
