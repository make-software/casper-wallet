import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Link, SvgIcon, Typography } from '@libs/ui';
import { AlignedFlexRow, CenteredFlexColumn, SpacingSize } from '@libs/layout';
import {
  getBlockExplorerAccountUrl,
  getBlockExplorerContractUrl,
  getBlockExplorerDeployUrl,
  getContractNftUrl
} from '@src/constants';
import { useCasperToken } from '@src/hooks';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { ContractPackageWithBalance } from '@libs/services/erc20-service';

interface HeaderViewInExplorerProps {
  tokenName?: string;
  deployHash?: string;
  nftTokenId?: string;
  contractHash?: string;
  erc20Tokens?: ContractPackageWithBalance[];
}

export function HeaderViewInExplorer({
  tokenName,
  deployHash,
  nftTokenId,
  contractHash,
  erc20Tokens
}: HeaderViewInExplorerProps) {
  const [hrefToTokenOnCasperLive, setHrefToTokenOnCasperLive] = useState<
    string | undefined
  >();
  const [hrefToDeployOnCasperLive, setHrefToDeployOnCasperLive] = useState<
    string | undefined
  >();
  const [hrefToNftOnCasperLive, setHrefToNftOnCasperLive] = useState<
    string | undefined
  >();

  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const activeAccount = useSelector(selectVaultActiveAccount);

  const casperToken = useCasperToken();

  useEffect(() => {
    if (!tokenName && deployHash) {
      setHrefToDeployOnCasperLive(
        getBlockExplorerDeployUrl(casperLiveUrl, deployHash)
      );
    }

    if (tokenName) {
      if (tokenName === 'Casper') {
        if (casperToken && activeAccount) {
          setHrefToTokenOnCasperLive(
            getBlockExplorerAccountUrl(casperLiveUrl, activeAccount.publicKey)
          );
        }
      } else {
        // ERC-20 token case
        const token = erc20Tokens?.find(
          token => token.contract_package_hash === tokenName
        );

        if (token) {
          setHrefToTokenOnCasperLive(
            getBlockExplorerContractUrl(
              casperLiveUrl,
              token.contract_package_hash
            )
          );
        }
      }
    }

    if (nftTokenId && contractHash) {
      setHrefToNftOnCasperLive(
        getContractNftUrl(casperLiveUrl, contractHash, nftTokenId)
      );
    }
  }, [
    tokenName,
    casperToken,
    activeAccount,
    casperLiveUrl,
    erc20Tokens,
    deployHash,
    nftTokenId,
    contractHash
  ]);

  if (
    !hrefToTokenOnCasperLive &&
    !hrefToDeployOnCasperLive &&
    !hrefToNftOnCasperLive
  ) {
    return null;
  }

  return (
    <Link
      color="inherit"
      target="_blank"
      href={
        hrefToTokenOnCasperLive ||
        hrefToDeployOnCasperLive ||
        hrefToNftOnCasperLive
      }
    >
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
