import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { UseFormProps, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { isEqualCaseInsensitive } from '@src/utils';

import { ILedgerAccountListItem } from '@popup/pages/import-account-from-ledger/types';

import {
  selectVaultAccountsNames,
  selectVaultLedgerAccounts
} from '@background/redux/vault/selectors';

import { AccountWithBalance } from '@libs/types/account';

export type ImportLedgerAccountsFromValue = Record<string, string>;

export const useImportLedgerAccountsForm = (
  ledgerAccountsWithBalance: ILedgerAccountListItem[]
) => {
  const { t } = useTranslation();

  const existingAccountNames = useSelector(selectVaultAccountsNames);
  const existingLedgerAccounts = useSelector(selectVaultLedgerAccounts);

  const formSchema = Yup.object().shape(
    ledgerAccountsWithBalance.reduce((shape, _, index) => {
      const name: string = `name-${index}`;

      return {
        ...shape,
        [`${name} + Check`]: Yup.boolean(),
        [name]: Yup.string().when(`${name} + Check`, {
          is: true,
          then: Yup.string()
            .test(
              'empty',
              t("Name can't be empty"),
              value => value != null && value.trim() !== ''
            )
            .max(20, t("Account name can't be longer than 20 characters"))
            .matches(
              /^[\daA-zZ\s]+$/,
              t('Account name can’t contain special characters')
            )
            .test(
              'unique',
              t('Account name is already taken'),
              (value, context) => {
                // Clone the parent context form field values
                const parentCopy = { ...context.parent };
                // Delete the current field from copied context
                delete parentCopy[name];

                // Collect the values from the updated form values object
                const otherValues: string[] = Object.values(parentCopy);

                // Perform the test. Returns true when there are no other fields with the same value
                // If any other field with the same value exists, returns false
                return (
                  value != null &&
                  !otherValues.includes(value) &&
                  !existingAccountNames.includes(value)
                );
              }
            ),
          otherwise: Yup.string().notRequired()
        })
      };
    }, {})
  );

  const formOptions: UseFormProps<ImportLedgerAccountsFromValue> = {
    shouldUnregister: true,
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: getDefaultAccountName(
      ledgerAccountsWithBalance,
      existingAccountNames,
      existingLedgerAccounts
    )
  };

  return useForm<ImportLedgerAccountsFromValue>(formOptions);
};

export function getDefaultAccountName(
  ledgerAccountsWithBalance: ILedgerAccountListItem[],
  existingAccountNames: string[],
  existingLedgerAccounts: AccountWithBalance[]
) {
  const accountString = 'Ledger account';
  let sequenceNumber = 1;

  return ledgerAccountsWithBalance.reduce(
    (previousValue, cur, currentIndex) => {
      let defaultName = `${accountString} ${sequenceNumber + currentIndex}`;

      const existingLedgerAcc = existingLedgerAccounts.find(acc =>
        isEqualCaseInsensitive(cur.publicKey, acc.publicKey)
      );

      if (existingLedgerAcc) {
        return {
          ...previousValue,
          [`name-${currentIndex}`]: existingLedgerAcc?.name ?? defaultName
        };
      }

      while (existingAccountNames.includes(defaultName)) {
        sequenceNumber++;
        defaultName = `${accountString} ${sequenceNumber + currentIndex}`;
      }

      return {
        ...previousValue,
        [`name-${currentIndex}`]: defaultName
      };
    },
    {}
  );
}
