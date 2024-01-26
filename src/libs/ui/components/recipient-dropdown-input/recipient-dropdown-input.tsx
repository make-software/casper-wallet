import React, { useEffect, useMemo, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectAllContacts } from '@background/redux/contacts/selectors';
import { selectRecentRecipientPublicKeys } from '@background/redux/recent-recipient-public-keys/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { useClickAway } from '@hooks/use-click-away';

import {
  AlignedFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  Input,
  List,
  RecipientPlate,
  SvgIcon,
  Typography
} from '@libs/ui/components';
import { TransferRecipientFormValues } from '@libs/ui/forms/transfer';
import { TransferNftRecipientFormValues } from '@libs/ui/forms/transfer-nft';

const SeparatorContainer = styled(AlignedFlexRow)`
  padding: 8px 16px;
`;

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
            publicKey: key
          };
        }
        return {
          name: '',
          publicKey: key
        };
      }),
    [contacts, recentRecipientPublicKeys]
  );

  const getUniquePublicKeyItemsWithId = useMemo(() => {
    const recentRecipientWithSeparator = recentRecipient.length
      ? [
          {
            name: '',
            publicKey: '',
            isResentSeparator: true
          },
          ...recentRecipient
        ]
      : [...recentRecipient];
    const contactsWithSeparator = contacts.length
      ? [
          {
            name: '',
            publicKey: '',
            isContactsSeparator: true
          },
          ...contacts
        ]
      : [];

    const items = [
      ...recentRecipientWithSeparator,
      ...contactsWithSeparator
    ].filter(item => item.publicKey !== activeAccount?.publicKey);

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

          trigger('recipientPublicKey');
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
      {isOpenRecentRecipientPublicKeysList && optionsRow.length ? (
        <List
          contentTop={SpacingSize.Tiny}
          rows={optionsRow}
          maxHeight={161}
          renderRow={row => {
            if ('isResentSeparator' in row) {
              return (
                <SeparatorContainer>
                  <Typography type="labelMedium" color="contentSecondary">
                    <Trans t={t}>Recent</Trans>
                  </Typography>
                </SeparatorContainer>
              );
            }
            if ('isContactsSeparator' in row) {
              return (
                <SeparatorContainer>
                  <Typography type="labelMedium" color="contentSecondary">
                    <Trans t={t}>Contacts</Trans>
                  </Typography>
                </SeparatorContainer>
              );
            }

            return (
              <RecipientPlate
                publicKey={row.publicKey}
                name={row.name}
                handleClick={() => {
                  setValue('recipientPublicKey', row.publicKey);

                  setIsOpenRecentRecipientPublicKeysList(false);
                  setShowRecipientPlate(true);
                  setRecipientName(row.name);

                  trigger('recipientPublicKey');
                }}
              />
            );
          }}
          marginLeftForItemSeparatorLine={56}
        />
      ) : null}
    </VerticalSpaceContainer>
  );
};
