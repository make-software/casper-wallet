import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { sortCurrencies } from '@popup/pages/buy-cspr/utils';

import {
  AlignedFlexRow,
  BaseLineFlexRow,
  ContentContainer,
  LeftAlignedFlexColumn,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { ResponseCurrencyProps } from '@libs/services/buy-cspr-service/types';
import { Input, List, Modal, SvgIcon, Typography } from '@libs/ui/components';
import { useBuyCSPR } from '@libs/ui/forms/buy-cspr';
import { formatNumber } from '@libs/ui/utils';

import { CurrencyRow } from './components/currency-row';
import { ListRow } from './components/list-row';
import { Switcher } from './components/switcher';

interface AmountProps {
  currencies: ResponseCurrencyProps[];
  selectedCurrency: ResponseCurrencyProps;
  setPaymentAmount: React.Dispatch<React.SetStateAction<number>>;
  setSelectedCurrency: React.Dispatch<
    React.SetStateAction<ResponseCurrencyProps>
  >;
  defaultAmount: string;
}

export const Amount = ({
  currencies,
  selectedCurrency,
  setPaymentAmount,
  setSelectedCurrency,
  defaultAmount
}: AmountProps) => {
  const [sortedCurrency, setSortedCurrency] = useState<ResponseCurrencyProps[]>(
    []
  );
  const { t } = useTranslation();

  const {
    register,
    control,
    setValue,
    formState: { errors }
  } = useBuyCSPR(defaultAmount);

  const {
    register: currencySearchRegister,
    control: controlCurrencySearch,
    setValue: setValueCurrencySearch
  } = useForm();

  const searchInputValue = useWatch({
    control: controlCurrencySearch,
    name: 'currencySearch'
  });

  const { onChange: onChangeFiatAmount } = register('fiatAmount');

  const inputValue = useWatch({
    control: control,
    name: 'fiatAmount'
  });

  useEffect(() => {
    const csprValue = (Number(inputValue) || 0) / selectedCurrency.rate;

    const formattedValue = formatNumber(csprValue, {
      precision: {
        max: 5
      }
    });

    setValue('casperAmount', formattedValue);
  }, [inputValue, selectedCurrency.rate, setValue]);

  useEffect(() => {
    const sortedCurrencies = sortCurrencies(
      currencies,
      selectedCurrency.code
    ).filter(currency =>
      currency.code
        .toLowerCase()
        .includes(searchInputValue?.toLowerCase() || '')
    );

    setSortedCurrency(sortedCurrencies);
  }, [currencies, searchInputValue, selectedCurrency.code]);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Enter amount</Trans>
        </Typography>
      </ParagraphContainer>

      <VerticalSpaceContainer top={SpacingSize.Medium}>
        <BaseLineFlexRow gap={SpacingSize.Large}>
          <Input
            type="number"
            label={t('Deposit amount')}
            placeholder="0.00"
            {...register('fiatAmount')}
            error={!!errors?.fiatAmount}
            validationText={errors.fiatAmount?.message}
            onChange={event => {
              onChangeFiatAmount(event);
              setPaymentAmount(Number(event.target.value));
            }}
            style={{ maxWidth: '200px' }}
          />
          <Modal
            renderContent={({ closeModal }) => (
              <Switcher
                label="Currency"
                closeSwitcher={closeModal}
                register={currencySearchRegister}
                searchName="currencySearch"
              >
                <List
                  contentTop={SpacingSize.Medium}
                  rows={sortedCurrency}
                  height={280}
                  renderRow={currency => {
                    const isSelected = selectedCurrency.code === currency.code;

                    return (
                      <ListRow
                        currency={currency}
                        handleSelect={(
                          e: React.MouseEvent<Element, MouseEvent>
                        ) => {
                          if (isSelected) {
                            return;
                          }

                          setSelectedCurrency(currency);
                          closeModal(e);
                        }}
                        isSelected={isSelected}
                      />
                    );
                  }}
                  marginLeftForItemSeparatorLine={16}
                />
              </Switcher>
            )}
            placement="fullBottom"
            children={() => (
              <CurrencyRow
                selectedCurrency={selectedCurrency}
                onClick={() => setValueCurrencySearch('currencySearch', '')}
              />
            )}
            childrenFlexGrow={1}
          />
        </BaseLineFlexRow>
      </VerticalSpaceContainer>

      <ParagraphContainer top={SpacingSize.XL}>
        <AlignedFlexRow gap={SpacingSize.Large}>
          <SvgIcon src="/assets/icons/arrows.svg" size={24} />
          <LeftAlignedFlexColumn>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Exchange rate by Coingecko</Trans>
            </Typography>
            <AlignedFlexRow gap={SpacingSize.Small}>
              <Typography type="bodyHash">1 CSPR</Typography>
              <Typography type="captionHash" color="contentSecondary">
                ~
              </Typography>
              <Typography type="body">{`${selectedCurrency.rate} ${selectedCurrency.code}`}</Typography>
            </AlignedFlexRow>
          </LeftAlignedFlexColumn>
        </AlignedFlexRow>
      </ParagraphContainer>

      <VerticalSpaceContainer top={SpacingSize.XL}>
        <Input
          label={t('You get (approx., before fee)')}
          placeholder="0.00"
          suffixText="CSPR"
          disabled
          {...register('casperAmount')}
        />
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
