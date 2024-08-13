import React, { useEffect, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useClickAway } from '@hooks/use-click-away';

import { SpacingSize, VerticalSpaceContainer } from '@libs/layout';
import { Input, RecipientPlate, SvgIcon, Tab, Tabs } from '@libs/ui/components';
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
}

export const RecipientTabs = ({
  recipientForm,
  setRecipientPublicKey,
  setRecipientName,
  recipientName
}: RecipientTabsProps) => {
  const [showRecipientPlate, setShowRecipientPlate] = useState(false);

  const { t } = useTranslation();

  const { register, trigger, control, formState, setValue } = recipientForm;
  const { errors } = formState;
  const { onChange } = register('recipientPublicKey');

  const inputValue = useWatch({
    control: control,
    name: 'recipientPublicKey'
  });

  const { ref: clickAwayRef } = useClickAway({
    callback: () => {
      if (formState.isValid) {
        setShowRecipientPlate(true);
      }
    }
  });

  useEffect(() => {
    if (formState.isValid) {
      setShowRecipientPlate(true);
    }
    //   This should trigger only once
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRecipient = (publicKey: string, name: string) => {
    if (setRecipientPublicKey) {
      setRecipientPublicKey(publicKey);
    }
    setValue('recipientPublicKey', publicKey);

    setShowRecipientPlate(true);
    setRecipientName(name);

    trigger('recipientPublicKey');
  };

  return showRecipientPlate ? (
    <VerticalSpaceContainer top={SpacingSize.XXL}>
      <RecipientPlate
        publicKey={inputValue}
        name={recipientName}
        recipientLabel={t('To recipient')}
        showFullPublicKey
        handleClick={() => {
          setShowRecipientPlate(false);

          trigger('recipientPublicKey');
        }}
      />
    </VerticalSpaceContainer>
  ) : (
    <VerticalSpaceContainer
      top={SpacingSize.XXXL}
      ref={clickAwayRef}
      onFocus={() => {
        setShowRecipientPlate(false);
      }}
    >
      <Input
        monotype
        prefixIcon={<SvgIcon src="assets/icons/search.svg" size={24} />}
        placeholder={t('Public key')}
        {...register('recipientPublicKey')}
        onChange={e => {
          onChange(e);

          if (setRecipientPublicKey) {
            setRecipientPublicKey(e.target.value);
          }
        }}
        error={!!errors?.recipientPublicKey}
        validationText={errors?.recipientPublicKey?.message}
      />
      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Tabs>
          <Tab tabName={RecipientTabName.Recent}>
            <RecentList handleSelectRecipient={handleSelectRecipient} />
          </Tab>
          <Tab tabName={RecipientTabName.MyAccounts}>
            <MyAccountsList handleSelectRecipient={handleSelectRecipient} />
          </Tab>
          <Tab tabName={RecipientTabName.Contacts}>
            <ContactsList handleSelectRecipient={handleSelectRecipient} />
          </Tab>
        </Tabs>
      </VerticalSpaceContainer>
    </VerticalSpaceContainer>
  );
};
