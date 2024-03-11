import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { RootState } from 'typesafe-actions';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  selectVaultAccount,
  selectVaultImportedAccountsNames,
  selectVaultLedgerAccountNames
} from '@background/redux/vault/selectors';

import { useFetchAccountInfo } from '@hooks/use-fetch-account-info';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  ContentContainer,
  FlexColumn,
  SpacingSize,
  TileContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  Hash,
  HashVariant,
  SvgIcon,
  Tile,
  Typography
} from '@libs/ui/components';

export function AccountSettingsPageContent() {
  const { t } = useTranslation();

  const { accountName } = useParams();
  const account = useSelector((state: RootState) =>
    selectVaultAccount(state, accountName || '')
  );

  if (!account) {
    throw new Error("Account doesn't exist");
  }

  const accountHash = getAccountHashFromPublicKey(account.publicKey);
  const { accountInfoStandardName } = useFetchAccountInfo(account);

  return (
    <>
      <ContentContainer>
        <Tile>
          <TileContainer paddingVertical={SpacingSize.XL}>
            <Typography type="header">{account.name}</Typography>
            {accountInfoStandardName && (
              <Typography type="body" ellipsis>
                {accountInfoStandardName}
              </Typography>
            )}
            <VerticalSpaceContainer top={SpacingSize.XL}>
              <FlexColumn gap={SpacingSize.Small}>
                <Typography type="bodySemiBold">
                  <Trans t={t}>Public key</Trans>
                </Typography>
                <Hash
                  value={account.publicKey}
                  variant={HashVariant.CaptionHash}
                />
              </FlexColumn>
            </VerticalSpaceContainer>
            <VerticalSpaceContainer top={SpacingSize.XL}>
              <FlexColumn gap={SpacingSize.Small}>
                <Typography type="bodySemiBold">
                  <Trans t={t}>Account hash</Trans>
                </Typography>
                <Hash value={accountHash} variant={HashVariant.CaptionHash} />
              </FlexColumn>
            </VerticalSpaceContainer>
          </TileContainer>
        </Tile>
      </ContentContainer>
    </>
  );
}

interface AccountIconButtonProps {
  type: 'rename' | 'remove';
}

function AccountIconButton({ type }: AccountIconButtonProps) {
  const { accountName } = useParams();
  const navigate = useTypedNavigate();

  const handleNavigateToNextPage = useCallback(() => {
    if (!accountName) {
      return;
    }

    switch (type) {
      case 'remove':
        navigate(RouterPath.RemoveAccount.replace(':accountName', accountName));
        break;
      case 'rename':
        navigate(RouterPath.RenameAccount.replace(':accountName', accountName));
        break;
      default:
        throw new Error('Not found');
    }
  }, [navigate, accountName, type]);

  if (!accountName) {
    return null;
  }

  return (
    <SvgIcon
      onClick={handleNavigateToNextPage}
      color={type === 'remove' ? 'contentActionCritical' : 'contentAction'}
      src={
        type === 'remove' ? 'assets/icons/delete.svg' : 'assets/icons/edit.svg'
      }
    />
  );
}

const AccountSettingsActionsGroupContainer = styled.div`
  display: flex;
  gap: 28px;
`;

export function AccountSettingsActionsGroup() {
  const { accountName } = useParams();
  const importedAccountNames = useSelector(selectVaultImportedAccountsNames);
  const ledgerAccountNames = useSelector(selectVaultLedgerAccountNames);

  if (!accountName) {
    return null;
  }

  const isImportedAccount = importedAccountNames.includes(accountName);
  const isLedgerAccount = ledgerAccountNames.includes(accountName);

  return (
    <AccountSettingsActionsGroupContainer>
      <AccountIconButton type="rename" />
      {(isImportedAccount || isLedgerAccount) && (
        <AccountIconButton type="remove" />
      )}
    </AccountSettingsActionsGroupContainer>
  );
}
