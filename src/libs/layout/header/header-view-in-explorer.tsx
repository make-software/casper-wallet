import { ITokenWithFiatBalance } from 'casper-wallet-core';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  getBlockExplorerAccountUrl,
  getBlockExplorerContractPackageUrl,
  getBlockExplorerDeployUrl,
  getContractNftUrl
} from '@src/constants';

import {
  selectApiConfigBasedOnActiveNetwork,
  selectIsCasper2Network
} from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { useCasperToken } from '@hooks/use-casper-token';

import { AlignedFlexRow, CenteredFlexColumn, SpacingSize } from '@libs/layout';
import { Link, SvgIcon, Typography } from '@libs/ui/components';

interface HeaderViewInExplorerProps {
  tokenName?: string;
  deployHash?: string;
  nftTokenId?: string;
  contractPackageHash?: string;
  cep18Tokens?: ITokenWithFiatBalance[];
}

export function HeaderViewInExplorer({
  tokenName,
  deployHash,
  nftTokenId,
  contractPackageHash,
  cep18Tokens
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
  const isCasper2Network = useSelector(selectIsCasper2Network);

  const casperToken = useCasperToken();

  useEffect(() => {
    if (!tokenName && deployHash) {
      setHrefToDeployOnCasperLive(
        getBlockExplorerDeployUrl(casperLiveUrl, deployHash, isCasper2Network)
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
        const token = cep18Tokens?.find(
          token => token.contractPackageHash === tokenName
        );

        if (token) {
          setHrefToTokenOnCasperLive(
            getBlockExplorerContractPackageUrl(
              casperLiveUrl,
              token.contractPackageHash
            )
          );
        }
      }
    }

    if (nftTokenId && contractPackageHash) {
      setHrefToNftOnCasperLive(
        getContractNftUrl(casperLiveUrl, contractPackageHash, nftTokenId)
      );
    }
  }, [
    tokenName,
    casperToken,
    activeAccount,
    casperLiveUrl,
    cep18Tokens,
    deployHash,
    nftTokenId,
    contractPackageHash
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
          <Typography type="bodySemiBold" color="contentAction">
            CSPR.live
          </Typography>
          <SvgIcon src="assets/icons/external-link.svg" color="contentAction" />
        </AlignedFlexRow>
      </CenteredFlexColumn>
    </Link>
  );
}
