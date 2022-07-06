import React, { useCallback } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { Trans, useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import * as Yup from 'yup';

import { useFormValidations } from '@src/hooks';

import { Button, Input, SvgIcon, Typography } from '@libs/ui';
import { AccountData } from '@popup/redux/vault/types';
import {
  FooterButtonsContainer,
  ContentContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@layout/containers';

import { RouterPath, useTypedNavigate } from '@import-account-with-file/router';

import {
  checkAccountNameIsTaken,
  sendImportedAccount
} from '@popup/redux/remote-actions';

import { useSecretKeyFileReader } from './hooks/use-secret-key-file-reader';

export function ImportAccountWithFileContentPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { createAccountNameValidation } = useFormValidations();

  const onSuccess = useCallback(
    async (accountData: AccountData) => {
      await sendImportedAccount(accountData);
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
      .required(t('File with secret key should be loaded'))
      .test('fileType', t('Unsupported file format'), value => {
        if (value && value.length > 0) {
          return ['application/x-x509-ca-cert'].includes(value[0].type);
        }
        return false;
      }),
    name: createAccountNameValidation(async value => {
      const isAccountNameTaken =
        value && (await checkAccountNameIsTaken(value));
      return !isAccountNameTaken;
    })
  });

  const formOptions: UseFormProps = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: {
      secretKeyFile: null,
      name: ''
    }
  };

  const {
    resetField,
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm(formOptions);

  async function onSubmit({
    secretKeyFile: { 0: secretKeyFile },
    name
  }: FieldValues) {
    secretKeyFileReader(name, secretKeyFile);
  }

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
              <SvgIcon
                onClick={() => resetField('secretKeyFile')}
                src="assets/icons/close-filter.svg"
                size={24}
              />
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
        <FooterButtonsContainer>
          <Button disabled={!isDirty}>
            <Trans t={t}>Import</Trans>
          </Button>
        </FooterButtonsContainer>
      </form>
    </ContentContainer>
  );
}
