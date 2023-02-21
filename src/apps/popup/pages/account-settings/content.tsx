import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'typesafe-actions';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  FlexColumn,
  LeftAlignedFlexColumn
} from '@src/libs/layout/containers';
import {
  Hash,
  HashDisplayContext,
  HashVariant,
  PageTile,
  SvgIcon,
  Typography
} from '@libs/ui';
import {
  selectVaultAccountWithName,
  selectVaultImportedAccounts
} from '@src/background/redux/vault/selectors';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';

const HeaderContainer = styled(LeftAlignedFlexColumn)`
  margin: 8px 0;
`;

const HashContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0 8px;
`;

export function AccountSettingsPageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { accountName } = useParams();
  const account = useSelector((state: RootState) =>
    selectVaultAccountWithName(state, accountName || '')
  );

  if (!account) {
    navigate(RouterPath.Home);
    return null;
  }

  const accountHash = getAccountHashFromPublicKey(account.publicKey);

  return (
    <>
      <ContentContainer>
        <PageTile>
          <FlexColumn>
            <HeaderContainer>
              <Typography type="header">{account.name}</Typography>
            </HeaderContainer>
            <HashContainer>
              <Typography type="bodySemiBold">
                <Trans t={t}>Public key</Trans>
              </Typography>
              <Hash
                value={account.publicKey}
                variant={HashVariant.CaptionHash}
                withCopyOnSelfClick
                displayContext={HashDisplayContext.AccountInfo}
              />
            </HashContainer>
            <HashContainer>
              <Typography type="bodySemiBold">
                <Trans t={t}>Account hash</Trans>
              </Typography>
              <Hash
                value={accountHash}
                variant={HashVariant.CaptionHash}
                withCopyOnSelfClick
                displayContext={HashDisplayContext.AccountInfo}
              />
            </HashContainer>
          </FlexColumn>
        </PageTile>
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

    const path =
      type === 'remove'
        ? RouterPath.RemoveAccount.replace(':accountName', accountName)
        : RouterPath.RenameAccount.replace(':accountName', accountName);

    navigate(path);
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
