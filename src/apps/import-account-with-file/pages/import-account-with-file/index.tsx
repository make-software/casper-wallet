import React, { useCallback } from 'react';
import Browser from 'webextension-polyfill';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { FieldValues, useForm } from 'react-hook-form';
import * as Yup from 'yup';

import { Keys } from 'casper-js-sdk';

import { useTypedNavigate } from '@src/hooks';

import {
  ButtonsContainer,
  ContentContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@src/layout/containers';
import { Button, Input, SvgIcon, Typography } from '@libs/ui';
import { RouterPath } from '@import-account-with-file/router';

import { useSecretKeyFileReader } from './hooks/use-secret-key-file-reader';

export function ImportAccountWithFileContentPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const onSuccess = useCallback(
    async (name: string, keyPair: Keys.Ed25519 | Keys.Secp256K1) => {
      await Browser.runtime.sendMessage({
        type: 'import-account',
        payload: {
          account: {
            name,
            keyPair
          }
        }
      });
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
    name: Yup.string()
      .required('Name is required')
      .max(20, 'Account name can’t be longer than 20 characters')
      .matches(
        /^[\daA-zZ\s]+$/,
        'Account name can’t contain special characters'
      )
      .test('unique', 'Account name is already taken', async value => {
        const isAccountNameTaken = await Browser.runtime.sendMessage({
          type: 'check-name-is-taken',
          payload: {
            accountName: value
          }
        });

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
        <ButtonsContainer>
          <Button disabled={!isDirty}>
            <Trans t={t}>Import</Trans>
          </Button>
        </ButtonsContainer>
      </form>
    </ContentContainer>
  );
}
