import React from 'react';
import { FieldValues, useForm } from 'react-hook-form';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { dispatchToMainStore } from '@background/redux/utils';
import { addWatchingAccount } from '@background/redux/vault/actions';

import {
  ContentContainer,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  InputsContainer,
  ParagraphContainer,
  PopupLayout,
  SpacingSize
} from '@libs/layout';
import {
  Button,
  FormField,
  Input,
  TextArea,
  Typography
} from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';

export const AddWatchAccount = () => {
  const navigate = useTypedNavigate();

  const {
    register,
    handleSubmit,
    formState: { isValid }
  } = useForm();

  const isButtonDisabled = calculateSubmitButtonDisabled({ isValid });

  const onSubmit = (data: FieldValues) => {
    dispatchToMainStore(
      addWatchingAccount({
        publicKey: data.publicKey.trim(),
        name: data.name.trim(),
        secretKey: '',
        hidden: false,
        imported: true
      })
    ).then(() => navigate(RouterPath.Home));
  };

  return (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <ContentContainer>
          <ParagraphContainer top={SpacingSize.XL}>
            <Typography type="header">Add watch account</Typography>
          </ParagraphContainer>
          <InputsContainer>
            <Input
              type="text"
              label="Name"
              placeholder="Name"
              {...register('name', {
                required: true
              })}
            />
            <FormField label={'Public key'}>
              <TextArea
                placeholder={'Public key'}
                type="captionHash"
                {...register('publicKey', {
                  required: true
                })}
              />
            </FormField>
          </InputsContainer>
        </ContentContainer>
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button type="submit" disabled={isButtonDisabled}>
            Add account
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
