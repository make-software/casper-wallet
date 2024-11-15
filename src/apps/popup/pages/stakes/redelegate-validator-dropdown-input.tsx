import { ValidatorDto } from 'casper-wallet-core/src/data/dto/validators';
import React, { useEffect, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ValidatorList } from '@popup/pages/stakes/components/validator-list';
import { useFilteredValidators } from '@popup/pages/stakes/utils';

import { useClickAway } from '@hooks/use-click-away';

import {
  AlignedFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Input, SvgIcon, ValidatorPlate } from '@libs/ui/components';
import { StakeNewValidatorFormValues } from '@libs/ui/forms/stakes-form';

interface ValidatorDropdownInputProps {
  newValidatorForm: UseFormReturn<StakeNewValidatorFormValues>;
  validatorList: ValidatorDto[] | null;
  validator: ValidatorDto | null;
  setValidator: React.Dispatch<React.SetStateAction<ValidatorDto | null>>;
  setStakeAmount: React.Dispatch<React.SetStateAction<string>>;
}

export const RedelegateValidatorDropdownInput = ({
  newValidatorForm,
  validatorList,
  validator,
  setValidator,
  setStakeAmount
}: ValidatorDropdownInputProps) => {
  const [isOpenValidatorPublicKeysList, setIsOpenValidatorPublicKeysList] =
    useState(true);
  const [showValidatorPlate, setShowValidatorPlate] = useState(false);

  const { t } = useTranslation();

  const { register, formState, setValue, control, trigger } = newValidatorForm;
  const { errors } = formState;

  const inputValue = useWatch({
    control: control,
    name: 'newValidatorPublicKey'
  });

  const { ref: clickAwayRef } = useClickAway({
    callback: async () => {
      const resetAndTriggerPublicKey = async (value: string) => {
        setValue('newValidatorPublicKey', value);
        await trigger('newValidatorPublicKey');
      };

      setIsOpenValidatorPublicKeysList(false);

      if (validator) {
        if (inputValue !== '') {
          setShowValidatorPlate(true);
          setValue('newValidatorPublicKey', validator.publicKey);
          setStakeAmount(validator.stake!);
          await resetAndTriggerPublicKey(validator.publicKey);
        } else {
          setShowValidatorPlate(false);
          setValidator(null);
          await resetAndTriggerPublicKey('');
        }
      } else {
        await resetAndTriggerPublicKey('');
      }
    }
  });

  useEffect(() => {
    trigger('newValidatorPublicKey');
  }, [trigger, validator]);

  useEffect(() => {
    if (formState.isValid) {
      setShowValidatorPlate(true);
    }
    //   This should trigger only once
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredValidatorsList = useFilteredValidators(
    inputValue,
    validatorList
  );

  const handleValidatorClick = (validator: ValidatorDto) => {
    setValue('newValidatorPublicKey', validator.publicKey);
    setStakeAmount(validator.stake!);

    setValidator(validator);

    setIsOpenValidatorPublicKeysList(false);
    setShowValidatorPlate(true);
  };

  return showValidatorPlate && validator ? (
    <VerticalSpaceContainer top={SpacingSize.XL}>
      <ValidatorPlate
        publicKey={validator.publicKey}
        fee={validator.fee}
        name={validator?.name}
        logo={validator?.svgLogo || validator?.imgLogo}
        formattedTotalStake={validator.formattedTotalStake}
        delegatorsNumber={validator?.delegatorsNumber}
        validatorLabel={t('To validator')}
        error={errors?.newValidatorPublicKey}
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
        label={t('To validator')}
        prefixIcon={<SvgIcon src="assets/icons/search.svg" size={24} />}
        suffixIcon={
          <AlignedFlexRow gap={SpacingSize.Small}>
            {inputValue && (
              <SvgIcon
                src="assets/icons/cross.svg"
                size={16}
                onClick={() => setValue('newValidatorPublicKey', '')}
              />
            )}
            <SvgIcon
              src="assets/icons/chevron-up.svg"
              flipByAxis={isOpenValidatorPublicKeysList ? undefined : 'X'}
              size={16}
            />
          </AlignedFlexRow>
        }
        placeholder={t('Validator public address')}
        {...register('newValidatorPublicKey')}
      />
      {isOpenValidatorPublicKeysList && (
        <ValidatorList
          filteredValidatorsList={filteredValidatorsList}
          totalStake="formattedTotalStake"
          handleValidatorClick={handleValidatorClick}
        />
      )}
    </VerticalSpaceContainer>
  );
};
