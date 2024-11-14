import { TokenDto } from 'casper-wallet-core/src/data/dto';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  getBlockExplorerAccountUrl,
  getBlockExplorerContractPackageUrl,
  getBlockExplorerDeployUrl,
  getContractNftUrl
} from '@src/constants';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { useCasperToken } from '@hooks/use-casper-token';

import { AlignedFlexRow, CenteredFlexColumn, SpacingSize } from '@libs/layout';
import { Link, SvgIcon, Typography } from '@libs/ui/components';

interface HeaderViewInExplorerProps {
  tokenName?: string;
  deployHash?: string;
  nftTokenId?: string;
  contractHash?: string;
  cep18Tokens?: TokenDto[];
}

export function HeaderViewInExplorer({
  tokenName,
  deployHash,
  nftTokenId,
  contractHash,
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
    cep18Tokens,
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
          <Typography type="bodySemiBold" color="contentAction">
            CSPR.live
          </Typography>
          <SvgIcon src="assets/icons/external-link.svg" color="contentAction" />
        </AlignedFlexRow>
      </CenteredFlexColumn>
    </Link>
  );
}
