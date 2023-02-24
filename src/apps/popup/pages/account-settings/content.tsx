import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  FlexColumn,
  SpacingSize,
  TileContainer,
  VerticalSpaceContainer
} from '@src/libs/layout/containers';
import {
  Hash,
  HashDisplayContext,
  HashVariant,
  Tile,
  SvgIcon,
  Typography
} from '@libs/ui';
import {
  selectVaultAccountWithName,
  selectVaultImportedAccounts
} from '@src/background/redux/vault/selectors';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';

export function AccountSettingsPageContent() {
  const { t } = useTranslation();

  const { accountName } = useParams();
  const account = useSelector((state: RootState) =>
    selectVaultAccountWithName(state, accountName || '')
  );

  if (!account) {
    throw new Error("Account doesn't exist");
  }

  const accountHash = getAccountHashFromPublicKey(account.publicKey);

  return (
    <>
      <ContentContainer>
        <Tile>
          <TileContainer paddingVertical={SpacingSize.Big}>
            <Typography type="header">{account.name}</Typography>
            <VerticalSpaceContainer top={SpacingSize.Big}>
              <FlexColumn gap={SpacingSize.Small}>
                <Typography type="bodySemiBold">
                  <Trans t={t}>Public key</Trans>
                </Typography>
                <Hash
                  value={account.publicKey}
                  variant={HashVariant.FullHash}
                  withCopyOnSelfClick
                  displayContext={HashDisplayContext.AccountInfo}
                />
              </FlexColumn>
            </VerticalSpaceContainer>
            <VerticalSpaceContainer top={SpacingSize.Big}>
              <FlexColumn gap={SpacingSize.Small}>
                <Typography type="bodySemiBold">
                  <Trans t={t}>Account hash</Trans>
                </Typography>
                <Hash
                  value={accountHash}
                  variant={HashVariant.FullHash}
                  withCopyOnSelfClick
                  displayContext={HashDisplayContext.AccountInfo}
                />
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
      color={type === 'remove' ? 'contentRed' : 'contentBlue'}
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
  const importedAccountNames = useSelector(selectVaultImportedAccounts).map(
    a => a.name
  );

  if (!accountName) {
    return null;
  }

  const isImportedAccount = importedAccountNames.includes(accountName);

  return (
    <AccountSettingsActionsGroupContainer>
      <AccountIconButton type="rename" />
      {isImportedAccount && <AccountIconButton type="remove" />}
    </AccountSettingsActionsGroupContainer>
  );
}
