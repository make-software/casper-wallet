import debounce from 'lodash.debounce';
import React, { useEffect, useMemo, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { isValidPublicKey } from '@src/utils';

import { selectAllContactsPublicKeys } from '@background/redux/contacts/selectors';
import { selectRecentRecipientPublicKeys } from '@background/redux/recent-recipient-public-keys/selectors';
import { selectVaultAccountsPublicKeys } from '@background/redux/vault/selectors';

import { SpacingSize, VerticalSpaceContainer } from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { Input, SvgIcon, Tab, Tabs } from '@libs/ui/components';
import { SearchItemByCsprName } from '@libs/ui/components/recipient-tabs/components/search-item-by-cspr-name';
import { SearchItemByPublicKey } from '@libs/ui/components/recipient-tabs/components/search-item-by-public-key';
import { SelectedRecipient } from '@libs/ui/components/recipient-tabs/components/selected-recipient';
import { TransferRecipientFormValues } from '@libs/ui/forms/transfer';
import { TransferNftRecipientFormValues } from '@libs/ui/forms/transfer-nft';

import { ContactsList } from './components/contacts-list';
import { MyAccountsList } from './components/my-accounts-list';
import { RecentList } from './components/recent-list';
import { RecipientTabName } from './utils';

interface RecipientTabsProps {
  recipientForm: UseFormReturn<
    TransferRecipientFormValues | TransferNftRecipientFormValues
  >;
  setRecipientPublicKey?: (value: React.SetStateAction<string>) => void;
  setRecipientName: React.Dispatch<React.SetStateAction<string>>;
  recipientName: string;
  setShowSelectedRecipient: React.Dispatch<React.SetStateAction<boolean>>;
  showSelectedRecipient: boolean;
}

export const RecipientTabs = ({
  recipientForm,
  setRecipientPublicKey,
  setRecipientName,
  recipientName,
  setShowSelectedRecipient,
  showSelectedRecipient
}: RecipientTabsProps) => {
  const [showSearchItem, setShowSearchItem] = useState<boolean>(false);

  const contactPublicKeys = useSelector(selectAllContactsPublicKeys);
  const recentRecipientPublicKeys = useSelector(
    selectRecentRecipientPublicKeys
  );
  const accountsPublicKeys = useSelector(selectVaultAccountsPublicKeys);

  const { t } = useTranslation();

  const { register, trigger, control, formState, setValue, clearErrors } =
    recipientForm;
  const { errors } = formState;
  const { onChange } = register('recipientPublicKey');

  const inputValue = useWatch({
    control: control,
    name: 'recipientPublicKey'
  });

  const publicKeys = useMemo(() => {
    const mergedKeys = new Set([
      ...contactPublicKeys,
      ...recentRecipientPublicKeys,
      ...accountsPublicKeys
    ]);
    return Array.from(mergedKeys);
  }, [accountsPublicKeys, contactPublicKeys, recentRecipientPublicKeys]);

  useEffect(() => {
    if (formState.isValid) {
      setShowSearchItem(true);
    }
  }, [formState.isValid]);

  useEffect(() => {
    if (formState.isValid) {
      setShowSelectedRecipient(true);
    }
    //   This should trigger only once
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRecipient = (publicKey: string, name: string) => {
    if (setRecipientPublicKey) {
      setRecipientPublicKey(publicKey);
    }
    setValue('recipientPublicKey', publicKey);

    setShowSelectedRecipient(true);
    setRecipientName(name);

    trigger('recipientPublicKey');
    setShowSelectedRecipient(true);
  };

  const accountsInfo = useFetchAccountsInfo(publicKeys);

  if (showSelectedRecipient) {
    return (
      <SelectedRecipient
        recipientName={recipientName}
        setShowSelectedRecipient={setShowSelectedRecipient}
        inputValue={inputValue}
        trigger={trigger}
      />
    );
  }

  return (
    <VerticalSpaceContainer
      top={SpacingSize.XXXL}
      onFocus={() => {
        setShowSelectedRecipient(false);
      }}
    >
      <Input
        monotype
        prefixIcon={
          <SvgIcon
            src="assets/icons/search.svg"
            size={24}
            color="contentDisabled"
          />
        }
        suffixIcon={
          inputValue && (
            <SvgIcon
              src="assets/icons/cross.svg"
              size={16}
              onClick={() => {
                setShowSelectedRecipient(false);
                setShowSearchItem(false);
                setValue('recipientPublicKey', '');
                if (setRecipientPublicKey) {
                  setRecipientPublicKey('');
                }
                setRecipientName('');
                trigger('recipientPublicKey');
              }}
            />
          )
        }
        placeholder={t('Public key or name')}
        {...register('recipientPublicKey')}
        onChange={debounce(e => {
          onChange(e);

          if (setRecipientPublicKey) {
            setRecipientPublicKey(e.target.value);
          }
        }, 500)}
        error={!!errors?.recipientPublicKey}
        validationText={errors?.recipientPublicKey?.message}
      />
      {showSearchItem && inputValue ? (
        inputValue.endsWith('.cspr') ? (
          <SearchItemByCsprName
            inputValue={inputValue}
            handleSelectRecipient={handleSelectRecipient}
          />
        ) : isValidPublicKey(inputValue) ? (
          <SearchItemByPublicKey
            inputValue={inputValue}
            handleSelectRecipient={handleSelectRecipient}
          />
        ) : null
      ) : (
        <Tabs onClick={inputValue ? undefined : clearErrors}>
          <Tab tabName={RecipientTabName.Recent}>
            <RecentList
              handleSelectRecipient={handleSelectRecipient}
              accountsInfo={accountsInfo}
            />
          </Tab>
          <Tab tabName={RecipientTabName.MyAccounts}>
            <MyAccountsList
              handleSelectRecipient={handleSelectRecipient}
              accountsInfo={accountsInfo}
            />
          </Tab>
          <Tab tabName={RecipientTabName.Contacts}>
            <ContactsList
              handleSelectRecipient={handleSelectRecipient}
              accountsInfo={accountsInfo}
            />
          </Tab>
        </Tabs>
      )}
    </VerticalSpaceContainer>
  );
};
