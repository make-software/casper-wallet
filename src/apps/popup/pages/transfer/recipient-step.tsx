import React, { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  TransferInputContainer,
  FlexRow
} from '@libs/layout';
import { Avatar, Input, List, SvgIcon, Typography } from '@libs/ui';
import { SenderDetails } from '@popup/pages/transfer/sender-details';
import { TransferFormValues } from '@libs/ui/forms/transfer';
import { selectRecentRecipientPublicKeys } from '@src/background/redux/recent-recipient-public-keys/selectors';
import { truncateKey } from '@libs/ui/components/hash/utils';
import { useClickAway } from '@libs/ui/hooks/use-click-away';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

interface RecipientStepProps {
  recipientForm: UseFormReturn<TransferFormValues>;
}

const PublicKeyOptionContainer = styled(FlexRow)`
  cursor: pointer;

  padding: 8px 16px;
`;

export const RecipientStep = ({ recipientForm }: RecipientStepProps) => {
  const [
    isOpenRecentRecipientPublicKeysList,
    setIsOpenRecentRecipientPublicKeysList
  ] = useState(false);

  const { t } = useTranslation();

  const recentRecipientPublicKeys = useSelector(
    selectRecentRecipientPublicKeys
  );
  const activeAccount = useSelector(selectVaultActiveAccount);

  const { ref: clickAwayRef } = useClickAway({
    callback: () => {
      setIsOpenRecentRecipientPublicKeysList(false);
    }
  });
  const {
    register,
    formState: { errors },
    setValue,
    control,
    trigger
  } = recipientForm;

  const inputValue = useWatch({
    control: control,
    name: 'recipientPublicKey'
  });

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

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Specify recipient</Trans>
        </Typography>
      </ParagraphContainer>
      <SenderDetails />

      <TransferInputContainer
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
        />
        {isOpenRecentRecipientPublicKeysList && (
          <List
            contentTop={SpacingSize.Tiny}
            rows={optionsRow}
            renderRow={({ publicKey }) => (
              <PublicKeyOptionContainer
                gap={SpacingSize.Medium}
                onClick={async () => {
                  setValue('recipientPublicKey', publicKey);
                  await trigger('recipientPublicKey');

                  setIsOpenRecentRecipientPublicKeysList(false);
                }}
              >
                <Avatar publicKey={publicKey} size={24} />
                <Typography type="captionHash">
                  {truncateKey(publicKey, { size: 'medium' })}
                </Typography>
              </PublicKeyOptionContainer>
            )}
            marginLeftForItemSeparatorLine={56}
          />
        )}
      </TransferInputContainer>
    </ContentContainer>
  );
};
