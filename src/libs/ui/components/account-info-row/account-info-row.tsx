import { Maybe } from 'casper-wallet-core/src/typings/common';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  getBlockExplorerAccountUrl,
  getBlockExplorerContractPackageUrl
} from '@src/constants';
import { isEqualCaseInsensitive, isPublicKeyHash } from '@src/utils';

import { selectAllContacts } from '@background/redux/contacts/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultAccounts } from '@background/redux/vault/selectors';

import { AlignedFlexRow } from '@libs/layout';
import {
  Hash,
  HashVariant,
  Link,
  SvgIcon,
  Typography
} from '@libs/ui/components';
import { AccountInfoIcon } from '@libs/ui/components/account-info-icon/account-info-icon';

import { CopyToClipboardComponent } from '../copy-to-clipboard-component/copy-to-clipboard-component';

interface AccountInfoRowProps {
  publicKey: Maybe<string>;
  label?: string;
  accountName?: string;
  imgLogo?: Maybe<string>;
  children?: React.ReactNode;
  iconSize?: number;
  isAction?: boolean;
  csprName: Maybe<string> | undefined;
  accountLink?: Maybe<string>;
  withCopyIcon?: boolean;
}

const AccountInfoContainer = styled(AlignedFlexRow)`
  column-gap: 8px;
  flex-wrap: wrap;
`;

const AccountInfoNameContainer = styled(AlignedFlexRow)`
  column-gap: 8px;
  flex-wrap: wrap;
`;

export const AccountInfoRow = ({
  publicKey,
  label,
  accountName,
  imgLogo,
  children,
  iconSize = 16,
  isAction = false,
  csprName,
  accountLink,
  withCopyIcon = false
}: AccountInfoRowProps) => {
  const [linkUrl, setLinkUrl] = useState('');

  const { t } = useTranslation();

  const accounts = useSelector(selectVaultAccounts);
  const contacts = useSelector(selectAllContacts);
  const {
    casperLiveUrl,
    auctionPoolContractHash,
    csprStudioCep47ContractHash,
    csprMarketContractHash
  } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
    if (
      publicKey &&
      (isEqualCaseInsensitive(publicKey, csprStudioCep47ContractHash) ||
        isEqualCaseInsensitive(publicKey, csprMarketContractHash))
    ) {
      setLinkUrl(
        getBlockExplorerContractPackageUrl(casperLiveUrl, publicKey || '')
      );
    } else {
      setLinkUrl(getBlockExplorerAccountUrl(casperLiveUrl, publicKey || ''));
    }
  }, [
    auctionPoolContractHash,
    casperLiveUrl,
    csprMarketContractHash,
    csprStudioCep47ContractHash,
    publicKey
  ]);

  const accountLabel = useMemo(
    () => accounts.find(acc => acc.publicKey === publicKey)?.name,
    [publicKey, accounts]
  );
  const contactName = useMemo(
    () => contacts.find(contact => contact.publicKey === publicKey)?.name,
    [publicKey, contacts]
  );

  const name = accountLabel || contactName || '';

  const getContractName = useCallback(() => {
    if (
      publicKey &&
      isEqualCaseInsensitive(publicKey, auctionPoolContractHash)
    ) {
      return 'Auction Pool';
    } else if (
      publicKey &&
      isEqualCaseInsensitive(publicKey, csprStudioCep47ContractHash)
    ) {
      return 'CSPR.studio';
    } else if (
      publicKey &&
      isEqualCaseInsensitive(publicKey, csprMarketContractHash)
    ) {
      return 'CSPR.market';
    }
  }, [
    auctionPoolContractHash,
    csprMarketContractHash,
    csprStudioCep47ContractHash,
    publicKey
  ]);

  const contractName = getContractName();
  const linkHref = isAction ? accountLink ?? linkUrl : undefined;

  return (
    <AccountInfoContainer>
      {children}
      {publicKey && (
        <>
          <Link color="inherit" href={linkHref} target="_blank">
            <AccountInfoNameContainer>
              {label && (
                <Typography type="captionRegular" color="contentSecondary">
                  <Trans t={t}>{label}</Trans>
                </Typography>
              )}
              <AccountInfoIcon
                publicKey={publicKey}
                accountName={accountName}
                iconUrl={imgLogo}
                size={iconSize}
              />
              {contractName ? (
                <Typography
                  type="captionRegular"
                  color={isAction ? 'contentAction' : 'contentPrimary'}
                >
                  {contractName}
                </Typography>
              ) : (
                <>
                  <Hash
                    value={publicKey}
                    variant={HashVariant.CaptionHash}
                    csprName={csprName}
                    ownerName={accountName}
                    truncated
                    label={
                      isPublicKeyHash(publicKey)
                        ? t('Public key')
                        : t('Account hash')
                    }
                    truncatedSize="base"
                    color={isAction ? 'contentAction' : 'contentPrimary'}
                    withCopyOnSelfClick={false}
                    withoutTooltip={!isAction}
                    placement="topRight"
                  />
                  {name && (
                    <Typography type="captionHash" color="contentSecondary">
                      {name}
                    </Typography>
                  )}
                </>
              )}
            </AccountInfoNameContainer>
          </Link>
          {withCopyIcon && (
            <CopyToClipboardComponent
              enabled={withCopyIcon}
              withCopyIcon={withCopyIcon}
              valueToCopy={publicKey || ''}
              copiedElement={
                <SvgIcon
                  src="assets/icons/tick.svg"
                  color={'contentPositive'}
                  size={16}
                />
              }
            >
              <SvgIcon
                src="assets/icons/copy.svg"
                color={'contentDisabled'}
                size={16}
              />
            </CopyToClipboardComponent>
          )}
        </>
      )}
    </AccountInfoContainer>
  );
};
