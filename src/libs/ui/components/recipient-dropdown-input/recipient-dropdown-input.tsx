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

interface RecipientDropdownInputProps {
  recipientForm: UseFormReturn<
    TransferRecipientFormValues | TransferNftRecipientFormValues
  >;
}

export const RecipientDropdownInput = ({
  recipientForm
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

  const optionsRow = useMemo(
    () =>
      recentRecipientPublicKeys
        .filter(item => item !== activeAccount?.publicKey)
        .map((item, index) => ({
          publicKey: item,
          id: index
        }))
        .filter(item => item.publicKey.includes(inputValue || '')),
    [activeAccount?.publicKey, inputValue, recentRecipientPublicKeys]
  );

  const recipientLabel = t('To recipient');

  return showRecipientPlate ? (
    <VerticalSpaceContainer top={SpacingSize.XL}>
      <RecipientPlate
        publicKey={inputValue}
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
        placeholder={t('Recipient public address')}
        {...register('recipientPublicKey')}
        error={!!errors?.recipientPublicKey}
        validationText={errors?.recipientPublicKey?.message}
        autoComplete="off"
      />
      {isOpenRecentRecipientPublicKeysList && (
        <List
          contentTop={SpacingSize.Tiny}
          rows={optionsRow}
          renderRow={({ publicKey }) => (
            <RecipientPlate
              publicKey={publicKey}
              handleClick={async () => {
                setValue('recipientPublicKey', publicKey);
                await trigger('recipientPublicKey');

                setIsOpenRecentRecipientPublicKeysList(false);
                setShowRecipientPlate(true);
              }}
            />
          )}
          marginLeftForItemSeparatorLine={56}
        />
      )}
    </VerticalSpaceContainer>
  );
};
