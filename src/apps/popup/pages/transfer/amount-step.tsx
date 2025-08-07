import Big from 'big.js';
import { formatFiatAmount } from 'casper-wallet-core';
import React, { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { TRANSFER_COST_MOTES, TRANSFER_MIN_AMOUNT_MOTES } from '@src/constants';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { TokenType } from '@hooks/use-casper-token';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import { Error, Input, Typography } from '@libs/ui/components';
import { TransactionFeePlate } from '@libs/ui/components/transaction-fee-plate/transaction-fee-plate';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useTransferAmountForm } from '@libs/ui/forms/transfer';
import {
  divideErc20Balance,
  handleNumericInput,
  motesToCSPR
} from '@libs/ui/utils';

interface AmountStepProps {
  isErc20Transfer: boolean;
  paymentAmount: string;
  selectedToken: TokenType | null | undefined;
  setAmount: (value: React.SetStateAction<string>) => void;
  setPaymentAmount: (value: React.SetStateAction<string>) => void;
  setTransferIdMemo: (value: React.SetStateAction<string>) => void;
  setIsAmountFormButtonDisabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AmountStep = ({
  isErc20Transfer,
  paymentAmount,
  selectedToken,
  setAmount,
  setPaymentAmount,
  setTransferIdMemo,
  setIsAmountFormButtonDisabled
}: AmountStepProps) => {
  const [disabled, setDisabled] = useState(false);
  const [maxAmountMotes, setMaxAmountMotes] = useState('0');

  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { networkName } = useSelector(selectApiConfigBasedOnActiveNetwork);

  const { accountBalance, currencyRate } = useFetchWalletBalance();

  const erc20Balance =
    (selectedToken?.balance &&
      divideErc20Balance(
        selectedToken.balance,
        selectedToken?.decimals || null
      )) ||
    null;

  const amountForm = useTransferAmountForm(
    erc20Balance,
    isErc20Transfer,
    accountBalance.liquidBalance,
    paymentAmount,
    selectedToken?.decimals
  );

  useEffect(() => {
    const maxAmountMotes: string = !accountBalance.liquidBalance
      ? '0'
      : Big(accountBalance.liquidBalance).sub(TRANSFER_COST_MOTES).toFixed();

    const hasEnoughBalance = Big(maxAmountMotes).gte(TRANSFER_MIN_AMOUNT_MOTES);

    setMaxAmountMotes(maxAmountMotes);
    setDisabled(!hasEnoughBalance);
  }, [accountBalance.liquidBalance]);

  useEffect(() => {
    if (!isErc20Transfer) {
      setAmount(motesToCSPR(TRANSFER_MIN_AMOUNT_MOTES));
    }
  }, [isErc20Transfer, setAmount]);

  const { register, formState, control, trigger, setValue } = amountForm;

  const { errors } = formState;

  useEffect(() => {
    if (formState.touchedFields.amount) {
      trigger();
    }
  }, [
    networkName,
    activeAccount?.publicKey,
    trigger,
    formState.touchedFields.amount,
    selectedToken?.amount,
    accountBalance.liquidBalance,
    paymentAmount
  ]);

  const { onChange: onChangeTransferIdMemo } = register('transferIdMemo');
  const { onChange: onChangeCSPRAmount } = register('amount');
  const { onChange: onChangePaymentAmount } = register('paymentAmount');

  const amount = useWatch({
    control,
    name: 'amount'
  });

  const paymentAmountFieldValue = useWatch({
    control,
    name: 'paymentAmount'
  });

  const amountLabel = t('Amount');
  const transferIdLabel = t('Transfer ID (memo)');
  const paymentAmoutLabel = t('Set custom transaction payment');
  const fiatAmount = !isErc20Transfer
    ? currencyRate?.rate && amount
      ? formatFiatAmount(currencyRate.rate, amount || '0')
      : null
    : selectedToken?.tokenPrice && amount
      ? formatFiatAmount(Number(selectedToken.tokenPrice), amount || '0')
      : null;
  const paymentFiatAmount = isErc20Transfer
    ? currencyRate?.rate
      ? formatFiatAmount(currencyRate.rate, paymentAmountFieldValue || '0')
      : null
    : undefined;

  useEffect(() => {
    const isAmountFormButtonDisabled = calculateSubmitButtonDisabled({
      isValid: formState.isValid
    });
    setIsAmountFormButtonDisabled(!!isAmountFormButtonDisabled);
  }, [formState.isValid, setIsAmountFormButtonDisabled]);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Enter amount</Trans>
        </Typography>
      </ParagraphContainer>

      {!isErc20Transfer && disabled && (
        <VerticalSpaceContainer top={SpacingSize.XL}>
          <Error
            header="Not enough CSPR"
            description="You don't have enough CSPR to cover the transfer minimum amount
              and the transaction payment."
          />
        </VerticalSpaceContainer>
      )}

      <VerticalSpaceContainer top={SpacingSize.XXL}>
        <Input
          label={amountLabel}
          rightLabel={fiatAmount}
          monotype
          type="number"
          placeholder={t('0.00')}
          suffixText={selectedToken?.symbol}
          {...register('amount')}
          disabled={!isErc20Transfer && disabled}
          autoFocus
          onChange={e => {
            onChangeCSPRAmount(e);
            setAmount(e.target.value);
          }}
          onKeyDown={handleNumericInput}
          error={!!errors?.amount}
          validationText={errors?.amount?.message}
        />
      </VerticalSpaceContainer>

      {!isErc20Transfer && (
        <ParagraphContainer top={SpacingSize.Small}>
          <Typography
            type="captionRegular"
            color="contentAction"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setAmount(motesToCSPR(maxAmountMotes));
              setValue('amount', motesToCSPR(maxAmountMotes));

              trigger('amount');
            }}
          >
            <Trans t={t}>Send max</Trans>
          </Typography>
        </ParagraphContainer>
      )}

      {/** transferIdMemo is only relevant for CSPR */}
      <VerticalSpaceContainer top={SpacingSize.XL}>
        {!isErc20Transfer ? (
          <Input
            label={transferIdLabel}
            monotype
            placeholder={t('Enter numeric value')}
            {...register('transferIdMemo')}
            disabled={disabled}
            onChange={e => {
              // replace all non-numeric characters
              e.target.value = e.target.value.replace(/[^0-9]/g, '');
              onChangeTransferIdMemo(e);
              setTransferIdMemo(e.target.value);
            }}
            error={!!errors?.transferIdMemo}
            validationText={errors?.transferIdMemo?.message}
          />
        ) : (
          <Input
            label={paymentAmoutLabel}
            rightLabel={paymentFiatAmount}
            monotype
            type="number"
            placeholder={t('Enter transaction payment')}
            suffixText={'CSPR'}
            {...register('paymentAmount')}
            error={!!errors?.paymentAmount}
            onChange={e => {
              onChangePaymentAmount(e);
              setPaymentAmount(e.target.value);
            }}
            onKeyDown={handleNumericInput}
            validationText={
              errors?.paymentAmount?.message ||
              "You'll be charged this amount in CSPR as a transaction payment. You can change it at your discretion."
            }
          />
        )}
      </VerticalSpaceContainer>
      {!isErc20Transfer && (
        <VerticalSpaceContainer top={SpacingSize.XL}>
          <TransactionFeePlate
            paymentAmount={motesToCSPR(TRANSFER_COST_MOTES)}
          />
        </VerticalSpaceContainer>
      )}
    </ContentContainer>
  );
};
