import React, { useCallback } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { Trans, useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import * as Yup from 'yup';

import { useFormValidations } from '@src/hooks';

import { Button, Input, SvgIcon, Typography } from '@libs/ui';
import { Account } from '@src/background/redux/vault/types';
import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@src/libs/layout/containers';

import { RouterPath, useTypedNavigate } from '@import-account-with-file/router';

import { checkAccountNameIsTaken } from '@src/background/redux/import-account-actions-should-be-removed';

import { useSecretKeyFileReader } from './hooks/use-secret-key-file-reader';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { accountImported } from '@src/background/redux/vault/actions';

export function ImportAccountWithFileContentPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { createAccountNameValidation } = useFormValidations();

  const onSuccess = useCallback(
    async (accountData: Account) => {
      dispatchToMainStore(accountImported(accountData));
      navigate(RouterPath.ImportAccountWithFileSuccess);
    },
    [navigate]
  );

  const onFailure = useCallback(
    (message?: string) => {
      navigate(RouterPath.ImportAccountWithFileFailure, {
        state: {
          importAccountStatusMessage: message
        }
      });
    },
    [navigate]
  );

  const { secretKeyFileReader } = useSecretKeyFileReader({
    onSuccess,
    onFailure
  });

  const formSchema = Yup.object().shape({
    secretKeyFile: Yup.mixed()
      .test(
        'required',
        t('File with secret key should be loaded'),
        filesArray => filesArray !== null && filesArray.length > 0
      )
      .test(
        'fileType',
        t('Please upload a .PEM containing your private key.'),
        filesArray => {
          if (filesArray && filesArray.length > 0) {
            return /\.pem$/.test(filesArray[0].name);
          }
          return false;
        }
      ),
    name: createAccountNameValidation(async value => {
      const isAccountNameTaken =
        value && (await checkAccountNameIsTaken(value));
      return !isAccountNameTaken;
    })
  });

  const formOptions: UseFormProps = {
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: {
      secretKeyFile: null,
      name: ''
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm(formOptions);

  async function onSubmit({
    secretKeyFile: { 0: secretKeyFile },
    name
  }: FieldValues) {
    secretKeyFileReader(name, secretKeyFile);
  }

  const isSubmitDisabled = !isValid || !isDirty;
  const secretKeyFile = watch('secretKeyFile');
  const isFileLoaded = secretKeyFile?.length > 0;

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Import account by uploading a file</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          <Trans t={t}>Import your account from Secret Key File.</Trans>
        </Typography>
      </TextContainer>
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputsContainer>
          <Input
            type="file"
            accept=".pem"
            prefixIcon={<SvgIcon src="assets/icons/file.svg" size={24} />}
            suffixIcon={
              isFileLoaded && (
                <SvgIcon
                  onClick={() =>
                    setValue('secretKeyFile', null, { shouldValidate: true })
                  }
                  src="assets/icons/close-filter.svg"
                  size={24}
                />
              )
            }
            {...register('secretKeyFile')}
            error={!!errors.secretKeyFile}
            validationText={errors.secretKeyFile?.message}
          />
          <Input
            type="text"
            placeholder={t('Account name')}
            {...register('name')}
            error={!!errors.name}
            validationText={errors.name?.message}
          />
        </InputsContainer>
        <FooterButtonsAbsoluteContainer>
          <Button disabled={isSubmitDisabled}>
            <Trans t={t}>Import</Trans>
          </Button>
        </FooterButtonsAbsoluteContainer>
      </form>
    </ContentContainer>
  );
}
