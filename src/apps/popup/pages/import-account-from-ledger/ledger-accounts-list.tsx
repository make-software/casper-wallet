import debounce from 'lodash.debounce';
import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectVaultLedgerAccounts } from '@background/redux/vault/selectors';

import {
  CenteredFlexRow,
  FlexColumn,
  LeftAlignedCenteredFlexRow,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import {
  Avatar,
  Checkbox,
  Hash,
  HashVariant,
  Input,
  List,
  Tooltip,
  Typography
} from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useImportLedgerAccountsForm } from '@libs/ui/forms/import-ledger-account';
import { formatNumber, motesToCSPR } from '@libs/ui/utils';

const ListItemContainer = styled(FlexColumn)<{ disabled?: boolean }>`
  padding: 20px 16px;

  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;
const FooterContainer = styled(LeftAlignedCenteredFlexRow)`
  padding: 18px 16px;
`;
const MoreItem = styled(Typography)`
  cursor: pointer;
`;
const AmountContainer = styled(FlexColumn)`
  max-width: 90px;
`;

interface ListProps {
  ledgerAccountsWithBalance: {
    id: number;
    publicKey: string;
    name?: string;
    balance: number | undefined;
  }[];
  setIsButtonDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedAccounts: { id: number; publicKey: string; name: string }[];
  setSelectedAccounts: React.Dispatch<
    React.SetStateAction<{ id: number; publicKey: string; name: string }[]>
  >;
  maxItemsToRender: number;
  setMaxItemsToRender: React.Dispatch<React.SetStateAction<number>>;
}

export const LedgerAccountsList = ({
  ledgerAccountsWithBalance,
  setIsButtonDisabled,
  selectedAccounts,
  setSelectedAccounts,
  maxItemsToRender,
  setMaxItemsToRender
}: ListProps) => {
  const { t } = useTranslation();

  const alreadyConnectedLedgerAccounts = useSelector(selectVaultLedgerAccounts);

  const {
    control,
    getValues,
    formState: { isValid }
  } = useImportLedgerAccountsForm(ledgerAccountsWithBalance);

  const handleInputChange = (id: number, newValue: string) => {
    // Update the state with the new value
    setSelectedAccounts(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, name: newValue.trim() } : item
      )
    );
  };

  const debounceInputChange = debounce(handleInputChange, 1000);

  useEffect(() => {
    const isButtonDisabled = calculateSubmitButtonDisabled({
      isValid
    });

    setIsButtonDisabled(!!isButtonDisabled);
  }, [isValid, setIsButtonDisabled]);

  return (
    <List
      rows={ledgerAccountsWithBalance}
      contentTop={SpacingSize.XL}
      maxItemsToRender={maxItemsToRender}
      renderRow={(account, index) => {
        const inputFieldName = `name-${index}`;
        const checkBoxFieldName = `name-${index} + Check`;
        const balance = formatNumber(motesToCSPR(String(account.balance)), {
          precision: { max: 0 }
        });

        const isAlreadyConnected = alreadyConnectedLedgerAccounts.find(
          alreadyConnectedAccount =>
            alreadyConnectedAccount.publicKey === account.publicKey
        );

        return (
          <ListItemContainer
            gap={SpacingSize.Medium}
            disabled={!!isAlreadyConnected}
            title={
              isAlreadyConnected
                ? 'This account already connected to the wallet'
                : undefined
            }
          >
            <Controller
              control={control}
              render={({ field }) => (
                <SpaceBetweenFlexRow
                  onClick={() => {
                    if (isAlreadyConnected) return;

                    const accountIndex = selectedAccounts.findIndex(
                      alreadySelectedAccount =>
                        alreadySelectedAccount.id === account.id
                    );
                    const accountName: string = getValues(inputFieldName);

                    let updatedAccounts;
                    if (accountIndex !== -1) {
                      // Account exists, remove from list:
                      updatedAccounts = selectedAccounts.filter(
                        alreadySelectedAccount =>
                          alreadySelectedAccount.id !== account.id
                      );
                    } else {
                      // Account doesn't exist, add to list:
                      updatedAccounts = selectedAccounts.concat({
                        ...account,
                        name: accountName
                      });
                    }

                    setSelectedAccounts(updatedAccounts);
                    field.onChange(!field.value);
                  }}
                >
                  <CenteredFlexRow gap={SpacingSize.Medium}>
                    <Avatar publicKey={account.publicKey} size={32} />
                    <Hash
                      value={account.publicKey}
                      variant={HashVariant.CaptionHash}
                      truncated
                      withoutTooltip
                      color="contentPrimary"
                    />
                  </CenteredFlexRow>
                  <CenteredFlexRow gap={SpacingSize.Medium}>
                    <AmountContainer>
                      <Tooltip
                        title={balance.length > 9 ? balance : undefined}
                        placement="topLeft"
                        overflowWrap
                        fullWidth
                      >
                        <Typography
                          type="bodyHash"
                          style={{ textAlign: 'right' }}
                          ellipsis
                        >
                          {balance}
                        </Typography>
                      </Tooltip>
                      <Typography
                        type="captionHash"
                        color="contentSecondary"
                        style={{ textAlign: 'right' }}
                      >
                        CSPR
                      </Typography>
                    </AmountContainer>
                    <Checkbox
                      checked={!!(isAlreadyConnected || field.value)}
                      variant="square"
                      disabled={!!isAlreadyConnected}
                    />
                  </CenteredFlexRow>
                </SpaceBetweenFlexRow>
              )}
              name={checkBoxFieldName}
            />
            {getValues(checkBoxFieldName) && (
              <Controller
                control={control}
                render={({
                  field: { value, onChange },
                  formState: { errors }
                }) => (
                  <Input
                    secondaryBackground
                    style={{
                      paddingLeft: '44px'
                    }}
                    value={value}
                    onChange={event => {
                      onChange(event);
                      debounceInputChange(account.id, event.target.value);
                    }}
                    error={!!errors[inputFieldName]}
                    validationText={errors[inputFieldName]?.message}
                  />
                )}
                name={inputFieldName}
              />
            )}
          </ListItemContainer>
        );
      }}
      marginLeftForItemSeparatorLine={56}
      renderFooter={() => (
        <FooterContainer>
          <MoreItem
            type="captionRegular"
            color="contentAction"
            onClick={() => setMaxItemsToRender(prevState => prevState + 5)}
          >
            <Trans t={t}>Show next 5 accounts</Trans>
          </MoreItem>
        </FooterContainer>
      )}
    />
  );
};
