import React from 'react';
import { useTranslation } from 'react-i18next';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { SpacingSize, VerticalSpaceContainer } from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { RecipientPlate } from '@libs/ui/components';

interface SelectedRecipientProps {
  inputValue: string;
  trigger: any;
  setShowSelectedRecipient: React.Dispatch<React.SetStateAction<boolean>>;
  recipientName: string;
}

export const SelectedRecipient = ({
  inputValue,
  trigger,
  setShowSelectedRecipient,
  recipientName
}: SelectedRecipientProps) => {
  const { t } = useTranslation();

  const accountsInfo = useFetchAccountsInfo([inputValue]);

  const accountHash = getAccountHashFromPublicKey(inputValue || '');

  const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
  const brandingLogo = accountsInfo && accountsInfo[accountHash]?.brandingLogo;

  return (
    <VerticalSpaceContainer top={SpacingSize.XXL}>
      <RecipientPlate
        publicKey={inputValue}
        name={recipientName}
        recipientLabel={t('To recipient')}
        showFullPublicKey
        handleClick={() => {
          setShowSelectedRecipient(false);

          trigger('recipientPublicKey');
        }}
        csprName={csprName}
        brandingLogo={brandingLogo}
      />
    </VerticalSpaceContainer>
  );
};
