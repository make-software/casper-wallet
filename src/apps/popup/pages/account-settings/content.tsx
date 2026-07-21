import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { RootState } from '@background/redux/store-types';
import { dispatchToMainStore } from '@background/redux/utils';
import { hideAccountFromListChanged } from '@background/redux/vault/actions';
import {
  selectVaultAccount,
  selectVaultAccountsPublicKeys,
  selectVaultHiddenAccountsNames,
  selectVaultImportedAccountNames,
  selectVaultLedgerAccountNames
} from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  ContentContainer,
  FlexColumn,
  SpacingSize,
  TileContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import {
  Hash,
  HashVariant,
  QrCode,
  SvgIcon,
  Tile,
  Typography
} from '@libs/ui/components';

// At 120px the modules were 2.45px each — the smallest QR we render, on the
// screen with the most room to spare (WALLET-1347). The tile gives us 296px;
// 240 takes the modules to 5.33px and still reads as an inset thumbnail rather
// than taking over the screen.
const QrCodeContainer = styled(VerticalSpaceContainer)`
  display: flex;
  justify-content: center;
`;

export function AccountSettingsPageContent() {
  const { t } = useTranslation();

  const { accountName } = useParams();
  const account = useSelector((state: RootState) =>
    selectVaultAccount(state, accountName || '')
  );
  const accountsPublicKeys = useSelector(selectVaultAccountsPublicKeys);

  if (!account) {
    throw new Error("Account doesn't exist");
  }

  const accountsInfo = useFetchAccountsInfo(accountsPublicKeys);
  const accountHash = getAccountHashFromPublicKey(account.publicKey);

  const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;

  return (
    <>
      <ContentContainer>
        <Tile>
          <TileContainer paddingVertical={SpacingSize.XL}>
            <Typography type="header">{account.name}</Typography>
            <QrCodeContainer top={SpacingSize.XL}>
              <QrCode value={account.publicKey} size={240} />
            </QrCodeContainer>
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
            {csprName ? (
              <VerticalSpaceContainer top={SpacingSize.XL}>
                <FlexColumn gap={SpacingSize.Small}>
                  <Typography type="bodySemiBold">
                    <Trans t={t}>CSPR.name</Trans>
                  </Typography>
                  <Typography type="captionRegular" color="contentSecondary">
                    {csprName}
                  </Typography>
                </FlexColumn>
              </VerticalSpaceContainer>
            ) : null}
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
  type: 'rename' | 'remove' | 'hide' | 'show';
}

function AccountIconButton({ type }: AccountIconButtonProps) {
  const { accountName } = useParams();
  const navigate = useTypedNavigate();

  const icons = {
    remove: 'assets/icons/delete.svg',
    rename: 'assets/icons/edit.svg',
    show: 'assets/icons/show.svg',
    hide: 'assets/icons/hide.svg'
  };

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
      case 'hide':
      case 'show':
        dispatchToMainStore(hideAccountFromListChanged({ accountName }));
        break;
      default:
        throw new Error('Not found');
    }
  }, [accountName, type, navigate]);

  if (!accountName) {
    return null;
  }

  return (
    <SvgIcon
      onClick={handleNavigateToNextPage}
      color={type === 'remove' ? 'contentActionCritical' : 'contentAction'}
      src={icons[type]}
      dataTestId={`${type}-account-icon`}
    />
  );
}

const AccountSettingsActionsGroupContainer = styled.div`
  display: flex;
  gap: 24px;
`;

export function AccountSettingsActionsGroup() {
  const { accountName } = useParams();
  const importedAccountNames = useSelector(selectVaultImportedAccountNames);
  const hiddenAccountsNames = useSelector(selectVaultHiddenAccountsNames);
  const ledgerAccountNames = useSelector(selectVaultLedgerAccountNames);

  if (!accountName) {
    return null;
  }

  const isImportedAccount = importedAccountNames.includes(accountName);
  const isAccountHidden = hiddenAccountsNames.includes(accountName);
  const isLedgerAccount = ledgerAccountNames.includes(accountName);

  return (
    <AccountSettingsActionsGroupContainer>
      <AccountIconButton type="rename" />
      <AccountIconButton type={isAccountHidden ? 'show' : 'hide'} />
      {(isImportedAccount || isLedgerAccount) && (
        <AccountIconButton type="remove" />
      )}
    </AccountSettingsActionsGroupContainer>
  );
}
