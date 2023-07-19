import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Link, SvgIcon, Typography } from '@libs/ui';
import { AlignedFlexRow, CenteredFlexColumn, SpacingSize } from '@libs/layout';
import {
  getBlockExplorerAccountUrl,
  getBlockExplorerContractUrl
} from '@src/constants';
import { formatErc20TokenBalance } from '@popup/pages/home/components/tokens-list/utils';
import { useCasperToken } from '@src/hooks';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { ContractPackageWithBalance } from '@libs/services/erc20-service';

interface HeaderViewInExplorerProps {
  erc20Tokens: ContractPackageWithBalance[] | null;
  tokenName?: string;
}

export function HeaderViewInExplorer({
  tokenName,
  erc20Tokens
}: HeaderViewInExplorerProps) {
  const casperToken = useCasperToken();
  const [hrefToTokenOnCasperLive, setHrefToTokenOnCasperLive] = useState<
    string | undefined
  >();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    if (tokenName === 'Casper') {
      if (casperToken && activeAccount) {
        setHrefToTokenOnCasperLive(
          getBlockExplorerAccountUrl(casperLiveUrl, activeAccount.publicKey)
        );
      }
    } else {
      // ERC-20 token case
      const erc20TokensList = formatErc20TokenBalance(erc20Tokens);
      const token = erc20TokensList?.find(token => token.id === tokenName);

      if (token) {
        setHrefToTokenOnCasperLive(
          getBlockExplorerContractUrl(casperLiveUrl, token.id)
        );
      }
    }
  }, [tokenName, casperToken, activeAccount, casperLiveUrl, erc20Tokens]);

  if (!hrefToTokenOnCasperLive) {
    return null;
  }

  return (
    <Link color="inherit" target="_blank" href={hrefToTokenOnCasperLive}>
      <CenteredFlexColumn gap={SpacingSize.Medium}>
        <AlignedFlexRow gap={SpacingSize.Small}>
          <Typography type="bodySemiBold" color="contentBlue">
            CSPR.live
          </Typography>
          <SvgIcon src="assets/icons/external-link.svg" color="contentBlue" />
        </AlignedFlexRow>
      </CenteredFlexColumn>
    </Link>
  );
}