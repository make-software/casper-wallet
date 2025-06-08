import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Account } from '@src/libs/types/account';

import { selectVaultAccountsPublicKeys } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  AlignedFlexRow,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { HeaderBackgroundContainer } from '@libs/layout/header/components/header-background-container';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { Avatar, Hash, HashVariant, Typography } from '@libs/ui/components';

interface HeaderConnectionStatusProps {
  account: Account;
  isConnected: boolean;
}

export function HeaderSigningAccount({
  account,
  isConnected
}: HeaderConnectionStatusProps) {
  const { t } = useTranslation();
  const accountsPublicKeys = useSelector(selectVaultAccountsPublicKeys);

  const accountsInfo = useFetchAccountsInfo(accountsPublicKeys);

  const accountHash = getAccountHashFromPublicKey(account.publicKey);

  const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
  const brandingLogo = accountsInfo && accountsInfo[accountHash]?.brandingLogo;

  return (
    <AlignedFlexRow gap={SpacingSize.Tiny}>
      <HeaderBackgroundContainer isOpen={false}>
        <Avatar
          size={36}
          publicKey={account.publicKey}
          withConnectedStatus
          isConnected={isConnected}
          displayContext="header"
          brandingLogo={brandingLogo}
          isAccountSwitcherOpen={false}
        />
      </HeaderBackgroundContainer>
      <LeftAlignedFlexColumn
        style={{ cursor: 'auto' }}
        onClick={event => {
          event.stopPropagation();
        }}
      >
        <Typography type="bodySemiBold" color="contentOnFill">
          {account.name}
        </Typography>
        <Hash
          label={t('Public key')}
          value={account.publicKey}
          csprName={csprName}
          variant={HashVariant.CaptionHash}
          color="contentOnFill"
          truncated
          withCopyIcon
          placement="bottomRight"
          withOpacity
        />
      </LeftAlignedFlexColumn>
    </AlignedFlexRow>
  );
}
