import React, { useEffect, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { AuctionManagerEntryPoint } from '@src/constants';

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
  Spinner,
  SvgIcon,
  Typography,
  ValidatorPlate
} from '@libs/ui/components';
import { StakeValidatorFormValues } from '@libs/ui/forms/stakes-form';

interface ValidatorDropdownInputProps {
  validatorForm: UseFormReturn<StakeValidatorFormValues>;
  validatorList: ValidatorResultWithId[] | null;
  validator: ValidatorResultWithId | null;
  setValidator: React.Dispatch<
    React.SetStateAction<ValidatorResultWithId | null>
  >;
  setStakeAmount: React.Dispatch<React.SetStateAction<string>>;
  stakeType: AuctionManagerEntryPoint;
  loading: boolean;
}

export const ValidatorDropdownInput = ({
  validatorForm,
  validatorList,
  validator,
  setValidator,
  setStakeAmount,
  stakeType,
  loading
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
      const resetAndTriggerPublicKey = async (value: string) => {
        setValue('validatorPublicKey', value);
        await trigger('validatorPublicKey');
      };

      setIsOpenValidatorPublicKeysList(false);

      if (validator) {
        if (inputValue !== '') {
          setShowValidatorPlate(true);
          setValue('validatorPublicKey', validator.public_key);
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
    trigger('validatorPublicKey');
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

  useEffect(() => {
    switch (stakeType) {
      case AuctionManagerEntryPoint.delegate: {
        setLabel('To validator');
        break;
      }
      case AuctionManagerEntryPoint.undelegate:
      case AuctionManagerEntryPoint.redelegate: {
        setLabel('From validator');
        break;
      }
    }
  }, [stakeType]);

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
        // TODO: remove user_stake after we merge recipient and amount steps for undelegation
        totalStake={
          stakeType === AuctionManagerEntryPoint.delegate
            ? validator.total_stake
            : validator.user_stake
        }
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
          <AlignedFlexRow gap={SpacingSize.Small}>
            {inputValue && (
              <SvgIcon
                src="assets/icons/cross.svg"
                size={16}
                onClick={() => setValue('validatorPublicKey', '')}
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
        {...register('validatorPublicKey')}
      />
      {loading && <Spinner />}
      {isOpenValidatorPublicKeysList && !loading && (
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
                // TODO: remove user_stake after we merge recipient and amount steps for undelegation
                totalStake={
                  stakeType === AuctionManagerEntryPoint.delegate
                    ? validator.total_stake
                    : validator.user_stake
                }
                delegatorsNumber={validator?.delegators_number}
                handleClick={() => {
                  setValue('validatorPublicKey', validator.public_key);
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
