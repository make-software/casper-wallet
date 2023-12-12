import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { UseFormReturn, useWatch } from 'react-hook-form';

import { selectRecentRecipientPublicKeys } from '@background/redux/recent-recipient-public-keys/selectors';
import { SpacingSize, VerticalSpaceContainer } from '@libs/layout';
import { Input, List, RecipientPlate, SvgIcon } from '@libs/ui';
import { TransferRecipientFormValues } from '@libs/ui/forms/transfer';
import { useClickAway } from '@libs/ui/hooks/use-click-away';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { TransferNftRecipientFormValues } from '@libs/ui/forms/transfer-nft';
import { selectAllContacts } from '@background/redux/contacts/selectors';

interface RecipientDropdownInputProps {
  recipientForm: UseFormReturn<
    TransferRecipientFormValues | TransferNftRecipientFormValues
  >;
  setRecipientName: React.Dispatch<React.SetStateAction<string>>;
  recipientName: string;
}

export const RecipientDropdownInput = ({
  recipientForm,
  setRecipientName,
  recipientName
}: RecipientDropdownInputProps) => {
  const [
    isOpenRecentRecipientPublicKeysList,
    setIsOpenRecentRecipientPublicKeysList
  ] = useState(false);
  const [showRecipientPlate, setShowRecipientPlate] = useState(false);

  const { t } = useTranslation();

  const recentRecipientPublicKeys = useSelector(
    selectRecentRecipientPublicKeys
  );
  const activeAccount = useSelector(selectVaultActiveAccount);
  const contacts = useSelector(selectAllContacts);

  const { register, formState, setValue, control, trigger } = recipientForm;
  const { errors } = formState;

  const inputValue = useWatch({
    control: control,
    name: 'recipientPublicKey'
  });
  const { ref: clickAwayRef } = useClickAway({
    callback: () => {
      setIsOpenRecentRecipientPublicKeysList(false);
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

  const recentRecipient = useMemo(
    () =>
      recentRecipientPublicKeys.map(key => {
        const contact = contacts.find(contact => contact.publicKey === key);
        if (contact) {
          return {
            name: contact.name,
            publicKey: key,
            isContact: false
          };
        }
        return {
          name: '',
          publicKey: key,
          isContact: false
        };
      }),
    [contacts, recentRecipientPublicKeys]
  );

  const getUniquePublicKeyItemsWithId = useMemo(() => {
    const items = [...recentRecipient, ...contacts].filter(
      item => item.publicKey !== activeAccount?.publicKey
    );

    return items.map((item, index) => ({ ...item, id: index }));
  }, [activeAccount?.publicKey, contacts, recentRecipient]);

  const optionsRow = useMemo(() => {
    return getUniquePublicKeyItemsWithId.filter(
      item =>
        item.publicKey.includes(inputValue || '') ||
        item.name.includes(inputValue || '')
    );
  }, [getUniquePublicKeyItemsWithId, inputValue]);

  const recipientLabel = t('To recipient');

  return showRecipientPlate ? (
    <VerticalSpaceContainer top={SpacingSize.XL}>
      <RecipientPlate
        publicKey={inputValue}
        name={recipientName}
        recipientLabel={recipientLabel}
        showFullPublicKey
        handleClick={() => {
          setShowRecipientPlate(false);
          setIsOpenRecentRecipientPublicKeysList(true);
        }}
      />
    </VerticalSpaceContainer>
  ) : (
    <VerticalSpaceContainer
      top={SpacingSize.XL}
      ref={clickAwayRef}
      onFocus={() => {
        setIsOpenRecentRecipientPublicKeysList(true);
      }}
    >
      <Input
        monotype
        label={recipientLabel}
        prefixIcon={<SvgIcon src="assets/icons/search.svg" size={24} />}
        placeholder={t('Public address or contact name')}
        {...register('recipientPublicKey')}
        error={!!errors?.recipientPublicKey}
        validationText={errors?.recipientPublicKey?.message}
        autoComplete="off"
      />
      {isOpenRecentRecipientPublicKeysList && (
        <List
          contentTop={SpacingSize.Tiny}
          rows={optionsRow}
          maxHeight={193}
          renderRow={row => (
            <RecipientPlate
              publicKey={row.publicKey}
              name={row.name}
              isContact={!('isContact' in row)}
              handleClick={async () => {
                setValue('recipientPublicKey', row.publicKey);

                setIsOpenRecentRecipientPublicKeysList(false);
                setShowRecipientPlate(true);
                setRecipientName(row.name);

                await trigger('recipientPublicKey');
              }}
            />
          )}
          marginLeftForItemSeparatorLine={56}
        />
      )}
    </VerticalSpaceContainer>
  );
};
