import { Player } from '@lottiefiles/react-lottie-player';
import debounce from 'lodash.debounce';
import React, { useEffect, useState } from 'react';
import {
  Controller,
  FieldValues,
  useFieldArray,
  useForm
} from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEqualCaseInsensitive } from '@src/utils';

import {
  selectVaultAccountsNames,
  selectVaultLedgerAccounts
} from '@background/redux/vault/selectors';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import dotsDarkModeAnimation from '@libs/animations/dots_dark_mode.json';
import dotsLightModeAnimation from '@libs/animations/dots_light_mode.json';
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
import { formatNumber, motesToCSPR } from '@libs/ui/utils';

import { ILedgerAccountListItem } from './types';

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
  ledgerAccountsWithBalance: ILedgerAccountListItem[];
  setIsButtonDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedAccounts: ILedgerAccountListItem[];
  setSelectedAccounts: React.Dispatch<
    React.SetStateAction<ILedgerAccountListItem[]>
  >;
  maxItemsToRender: number;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

type FormFields = FieldValues & {
  accountNames: { name: string }[];
  checkbox: boolean[];
};

export const LedgerAccountsList = ({
  ledgerAccountsWithBalance,
  setIsButtonDisabled,
  selectedAccounts,
  setSelectedAccounts,
  maxItemsToRender,
  onLoadMore,
  isLoadingMore
}: ListProps) => {
  const [accountNames, setAccountNames] = useState<{ name: string }[]>([]);
  const [checkboxes, setCheckboxes] = useState<boolean[]>([]);

  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  const alreadyConnectedLedgerAccounts = useSelector(selectVaultLedgerAccounts);
  const existingAccountNames = useSelector(selectVaultAccountsNames);

  const {
    control,
    formState: { isValid },
    getValues,
    trigger
  } = useForm<FormFields>({
    defaultValues: {
      accountNames: [],
      checkbox: []
    },
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  const { fields: inputsFields, append } = useFieldArray({
    name: 'accountNames',
    control
  });

  useEffect(() => {
    for (
      let i = inputsFields.length;
      i < ledgerAccountsWithBalance.length;
      i++
    ) {
      append({ name: `Ledger account ${i + 1}` });
    }
  }, [append, inputsFields.length, ledgerAccountsWithBalance]);

  useEffect(() => {
    setAccountNames(getValues('accountNames'));
    setCheckboxes(getValues('checkbox'));
  }, [getValues]);

  const handleInputChange = (id: string, newValue: string) => {
    // Update the state with the new value
    setSelectedAccounts(prevItems =>
      prevItems.map(item =>
        isEqualCaseInsensitive(item.id, id)
          ? { ...item, name: newValue.trim() }
          : item
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
    <List<ILedgerAccountListItem>
      rows={ledgerAccountsWithBalance}
      contentTop={SpacingSize.XL}
      maxItemsToRender={maxItemsToRender}
      renderRow={(account, index) => {
        const inputFieldName = `accountNames.${index}.name`;
        const checkBoxFieldName = `checkbox.${index}`;
        const balance = formatNumber(
          motesToCSPR(String(account.balance.liquidMotes)),
          {
            precision: { max: 0 }
          }
        );

        const isAlreadyConnected = alreadyConnectedLedgerAccounts.some(
          alreadyConnectedAccount =>
            isEqualCaseInsensitive(
              alreadyConnectedAccount.publicKey,
              account.publicKey
            )
        );

        const checkboxValue = getValues(checkBoxFieldName);

        return (
          <ListItemContainer
            gap={SpacingSize.Medium}
            disabled={isAlreadyConnected}
            title={
              isAlreadyConnected
                ? 'This account already connected to the wallet'
                : undefined
            }
          >
            <Controller
              control={control}
              render={({ field: checkboxControllerField }) => (
                <SpaceBetweenFlexRow
                  onClick={() => {
                    if (isAlreadyConnected) return;

                    const accountIndex = selectedAccounts.findIndex(
                      alreadySelectedAccount =>
                        isEqualCaseInsensitive(
                          alreadySelectedAccount.id,
                          account.id
                        )
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
                    checkboxControllerField.onChange(
                      !checkboxControllerField.value
                    );

                    trigger();
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
                      checked={
                        isAlreadyConnected || checkboxControllerField.value
                      }
                      variant="square"
                      disabled={isAlreadyConnected}
                    />
                  </CenteredFlexRow>
                </SpaceBetweenFlexRow>
              )}
              name={checkBoxFieldName}
            />
            {(checkboxValue || isAlreadyConnected) &&
              inputsFields.map((inputField, inputFieldIndex) =>
                inputFieldIndex === index ? (
                  <Controller
                    key={inputField.id}
                    render={({
                      field: inputControllerField,
                      formState: inputControllerFormState
                    }) => {
                      return (
                        <Input
                          {...inputControllerField}
                          secondaryBackground
                          disabled={Boolean(isAlreadyConnected)}
                          style={{
                            paddingLeft: '44px'
                          }}
                          onChange={event => {
                            inputControllerField.onChange(event);
                            debounceInputChange(account.id, event.target.value);

                            // manually trigger validation in case when a few inputs have the same name
                            // and user change one of them.
                            // So we validate all of them to remove error from the fields.
                            // This is an edge case.
                            trigger();
                          }}
                          error={
                            !!inputControllerFormState.errors.accountNames?.[
                              inputFieldIndex
                            ]?.name
                          }
                          validationText={
                            inputControllerFormState.errors.accountNames?.[
                              inputFieldIndex
                            ]?.name?.message
                          }
                        />
                      );
                    }}
                    control={control}
                    name={`accountNames.${inputFieldIndex}.name`}
                    rules={{
                      pattern: {
                        value: /^[\daA-zZ\s]+$/,
                        message: t(
                          'Account name can’t contain special characters'
                        )
                      },
                      validate:
                        checkboxValue && !isAlreadyConnected
                          ? {
                              noEmptyInput: value =>
                                (value != null && value.trim() !== '') ||
                                t("Name can't be empty"),
                              maxLength: value =>
                                value.length <= 20 ||
                                t(
                                  "Account name can't be longer than 20 characters"
                                ),
                              unique: value => {
                                // Filter the inputs of 'accountNames' to only leave those where the checkbox is checked
                                // and the field index doesn't match the current input field index.
                                // This leaves us with an array of inputs that are selected
                                // (checked) and not the one being validated.
                                const onlyCheckedInputs = accountNames
                                  .map((input, index) =>
                                    checkboxes[index] ? input : null
                                  )
                                  .filter(
                                    (input, index) =>
                                      index !== inputFieldIndex &&
                                      input !== null
                                  );

                                // Checks to see if the current value exists within the selected inputs.
                                // The `some` function will return true as soon as it finds a value that matches,
                                // hence it will return false if the name is unique.
                                const isUnique = !onlyCheckedInputs.some(
                                  input => input?.name === value
                                );

                                // Checks if the current value exists in the 'existingAccountNames' array.
                                const isNotInExistingAccountNames =
                                  !existingAccountNames.includes(value);

                                // Returns the validation results.
                                // If the entered account name is both unique and not in the existing account names array,
                                // it returns true (passing validation),
                                // otherwise it returns the error message.
                                return (
                                  (isUnique && isNotInExistingAccountNames) ||
                                  t('Account name is already taken')
                                );
                              }
                            }
                          : undefined
                    }}
                  />
                ) : null
              )}
          </ListItemContainer>
        );
      }}
      marginLeftForItemSeparatorLine={56}
      renderFooter={() =>
        isLoadingMore ? (
          <Player
            renderer="svg"
            autoplay
            loop
            src={isDarkMode ? dotsDarkModeAnimation : dotsLightModeAnimation}
            style={{ height: '80px' }}
          />
        ) : (
          <FooterContainer>
            <MoreItem
              type="captionRegular"
              color="contentAction"
              onClick={onLoadMore}
            >
              <Trans t={t}>Show next 5 accounts</Trans>
            </MoreItem>
          </FooterContainer>
        )
      }
    />
  );
};
