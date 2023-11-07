import React, { useCallback, useEffect, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedSpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@src/libs/layout';
import { SvgIcon, Input, List, ValidatorPlate, Typography } from '@libs/ui';
import { StakeValidatorFormValues } from '@libs/ui/forms/stakes-form';
import { useClickAway } from '@libs/ui/hooks/use-click-away';
import { ValidatorResultWithId } from '@libs/services/validators-service/types';
import { AuctionManagerEntryPoint } from '@libs/services/deployer-service';

const DropDownHeader = styled(AlignedSpaceBetweenFlexRow)`
  padding: 8px 16px;

  border-top-left-radius: ${({ theme }) => theme.borderRadius.base}px;
  border-top-right-radius: ${({ theme }) => theme.borderRadius.base}px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;

interface ValidatorDropdownInputProps {
  validatorForm: UseFormReturn<StakeValidatorFormValues>;
  validatorList: ValidatorResultWithId[] | null;
  validator: ValidatorResultWithId | null;
  setValidator: React.Dispatch<
    React.SetStateAction<ValidatorResultWithId | null>
  >;
  setStakeAmount: React.Dispatch<React.SetStateAction<string>>;
  stakesType: AuctionManagerEntryPoint;
}

export const ValidatorDropdownInput = ({
  validatorForm,
  validatorList,
  validator,
  setValidator,
  setStakeAmount,
  stakesType
}: ValidatorDropdownInputProps) => {
  const [isOpenValidatorPublicKeysList, setIsOpenValidatorPublicKeysList] =
    useState(true);
  const [showValidatorPlate, setShowValidatorPlate] = useState(false);
  const [label, setLabel] = useState('');

  const { t } = useTranslation();

  const { register, formState, setValue, control, trigger } = validatorForm;
  const { errors } = formState;

  const inputValue = useWatch({
    control: control,
    name: 'validatorPublicKey'
  });

  const { ref: clickAwayRef } = useClickAway({
    callback: async () => {
      setIsOpenValidatorPublicKeysList(false);

      if (validator && inputValue !== '') {
        setShowValidatorPlate(true);
        setValue('validatorPublicKey', validator.public_key);
        setStakeAmount(validator.user_stake!);
        await trigger('validatorPublicKey');
        return;
      } else if (validator && inputValue === '') {
        setShowValidatorPlate(false);
        setValue('validatorPublicKey', '');
        setValidator(null);
        await trigger('validatorPublicKey');
        return;
      }

      setValue('validatorPublicKey', '');
      await trigger('validatorPublicKey');
    }
  });

  useEffect(() => {
    trigger('validatorPublicKey');
  }, [trigger, validator]);

  useEffect(() => {
    if (formState.isValid) {
      setShowValidatorPlate(true);
    }
    //   This should trigger only once
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useFilteredValidators = (
    inputValue: string,
    validatorList: ValidatorResultWithId[] | null
  ) => {
    const filterValidators = useCallback(
      (
        inputValue: string,
        validatorList: ValidatorResultWithId[] | null
      ): ValidatorResultWithId[] | [] => {
        if (!validatorList) return [];
        if (!inputValue) return validatorList;

        return validatorList.filter(validator => {
          const { public_key } = validator;
          if (validator?.account_info?.info?.owner?.name) {
            const { name } = validator.account_info.info.owner;

            return (
              name?.toLowerCase().includes(inputValue?.toLowerCase()) ||
              public_key?.toLowerCase().includes(inputValue?.toLowerCase())
            );
          }

          return public_key?.toLowerCase().includes(inputValue?.toLowerCase());
        });
      },
      []
    );

    return filterValidators(inputValue, validatorList);
  };

  const filteredValidatorsList = useFilteredValidators(
    inputValue,
    validatorList
  );

  useEffect(() => {
    switch (stakesType) {
      case AuctionManagerEntryPoint.delegate: {
        setLabel('To validator');
        break;
      }
      case AuctionManagerEntryPoint.undelegate: {
        setLabel('From validator');
        break;
      }

      default:
        throw Error('fetch validator: unknown stakes type');
    }
  }, [stakesType]);

  return showValidatorPlate && validator ? (
    <VerticalSpaceContainer top={SpacingSize.XL}>
      <ValidatorPlate
        publicKey={validator.public_key}
        fee={validator.fee}
        name={validator?.account_info?.info?.owner?.name}
        logo={validator?.account_info?.info?.owner?.branding?.logo?.svg}
        totalStake={validator.total_stake}
        delegatorsNumber={validator?.delegators_number}
        validatorLabel={label}
        error={errors?.validatorPublicKey}
        handleClick={() => {
          setShowValidatorPlate(false);
          setIsOpenValidatorPublicKeysList(true);
        }}
      />
    </VerticalSpaceContainer>
  ) : (
    <VerticalSpaceContainer
      top={SpacingSize.XL}
      ref={clickAwayRef}
      onFocus={() => {
        setIsOpenValidatorPublicKeysList(true);
      }}
    >
      {/*TODO: create Select component and rewrite this*/}
      <Input
        monotype
        label={label}
        prefixIcon={<SvgIcon src="assets/icons/search.svg" size={24} />}
        suffixIcon={
          <SvgIcon
            src="assets/icons/chevron-up.svg"
            flipByAxis={isOpenValidatorPublicKeysList ? undefined : 'X'}
            size={24}
          />
        }
        placeholder={t('Validator public address')}
        {...register('validatorPublicKey')}
        autoComplete="off"
      />
      {isOpenValidatorPublicKeysList && (
        <List
          contentTop={SpacingSize.Tiny}
          rows={filteredValidatorsList}
          maxHeight={192}
          stickyHeader
          borderRadius="base"
          renderHeader={() => (
            <DropDownHeader>
              <Typography type="labelMedium" color="contentSecondary">
                <Trans t={t}>Validator</Trans>
              </Typography>
              <Typography type="labelMedium" color="contentSecondary">
                <Trans t={t}>Total stake & fee</Trans>
              </Typography>
            </DropDownHeader>
          )}
          renderRow={validator => (
            <ValidatorPlate
              publicKey={validator?.public_key}
              fee={validator.fee}
              name={validator?.account_info?.info?.owner?.name}
              logo={validator?.account_info?.info?.owner?.branding?.logo?.svg}
              totalStake={validator.total_stake}
              delegatorsNumber={validator?.delegators_number}
              handleClick={async () => {
                setValue('validatorPublicKey', validator.public_key);
                setStakeAmount(validator.user_stake!);

                setValidator(validator);

                setIsOpenValidatorPublicKeysList(false);
                setShowValidatorPlate(true);
              }}
            />
          )}
          marginLeftForItemSeparatorLine={56}
          marginLeftForHeaderSeparatorLine={0}
        />
      )}
    </VerticalSpaceContainer>
  );
};
