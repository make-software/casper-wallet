import React, { useEffect, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { useFilteredValidators } from '@popup/pages/stakes/utils';

import { useClickAway } from '@hooks/use-click-away';

import {
  AlignedFlexRow,
  DropdownHeader,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { ValidatorResultWithId } from '@libs/services/validators-service/types';
import {
  Input,
  List,
  SvgIcon,
  Typography,
  ValidatorPlate
} from '@libs/ui/components';
import { StakeNewValidatorFormValues } from '@libs/ui/forms/stakes-form';

interface ValidatorDropdownInputProps {
  newValidatorForm: UseFormReturn<StakeNewValidatorFormValues>;
  validatorList: ValidatorResultWithId[] | null;
  validator: ValidatorResultWithId | null;
  setValidator: React.Dispatch<
    React.SetStateAction<ValidatorResultWithId | null>
  >;
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
          setValue('newValidatorPublicKey', validator.public_key);
          setStakeAmount(validator.user_stake!);
          await resetAndTriggerPublicKey(validator.public_key);
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

  return showValidatorPlate && validator ? (
    <VerticalSpaceContainer top={SpacingSize.XL}>
      <ValidatorPlate
        publicKey={validator.public_key}
        fee={validator.fee}
        name={validator?.account_info?.info?.owner?.name}
        logo={
          validator?.account_info?.info?.owner?.branding?.logo?.svg ||
          validator?.account_info?.info?.owner?.branding?.logo?.png_256 ||
          validator?.account_info?.info?.owner?.branding?.logo?.png_1024
        }
        totalStake={validator.user_stake}
        delegatorsNumber={validator?.delegators_number}
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
        autoComplete="off"
      />
      {isOpenValidatorPublicKeysList && (
        <List
          contentTop={SpacingSize.Tiny}
          rows={filteredValidatorsList}
          maxHeight={193}
          stickyHeader
          borderRadius="base"
          renderHeader={() => (
            <DropdownHeader>
              <Typography type="labelMedium" color="contentSecondary">
                <Trans t={t}>Validator</Trans>
              </Typography>
              <Typography type="labelMedium" color="contentSecondary">
                <Trans t={t}>Total stake, fee, delegators</Trans>
              </Typography>
            </DropdownHeader>
          )}
          renderRow={validator => {
            const logo =
              validator?.account_info?.info?.owner?.branding?.logo?.svg ||
              validator?.account_info?.info?.owner?.branding?.logo?.png_256 ||
              validator?.account_info?.info?.owner?.branding?.logo?.png_1024;

            return (
              <ValidatorPlate
                publicKey={validator?.public_key}
                fee={validator.fee}
                name={validator?.account_info?.info?.owner?.name}
                logo={logo}
                totalStake={validator.user_stake}
                delegatorsNumber={validator?.delegators_number}
                handleClick={() => {
                  setValue('newValidatorPublicKey', validator.public_key);
                  setStakeAmount(validator.user_stake!);

                  setValidator(validator);

                  setIsOpenValidatorPublicKeysList(false);
                  setShowValidatorPlate(true);
                }}
              />
            );
          }}
          marginLeftForItemSeparatorLine={56}
          marginLeftForHeaderSeparatorLine={0}
        />
      )}
    </VerticalSpaceContainer>
  );
};
