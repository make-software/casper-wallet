import React, { useCallback } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { Trans, useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import * as Yup from 'yup';

import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  IllustrationContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@src/libs/layout';
import { Button, Input, SvgIcon, Typography } from '@src/libs/ui';

import { useAccountNameRule } from '@src/libs/ui/forms/form-validation-rules';

import { Account } from '@src/background/redux/vault/types';
import { checkAccountNameIsTaken } from '@src/background/redux/import-account-actions-should-be-removed';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { accountImported } from '@src/background/redux/vault/actions';

import {
  RouterPath,
  useTypedNavigate
} from '@src/apps/import-account-with-file/router';

import { useSecretKeyFileReader } from './hooks/use-secret-key-file-reader';

export function ImportAccountWithFileContentPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

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
        t('File is required.'),
        filesArray => filesArray != null && filesArray.length > 0
      )
      .test(
        'fileType',
        t('Please upload a PEM file containing private key.'),
        filesArray => {
          if (filesArray != null && filesArray.length > 0) {
            return /\.pem$/.test(filesArray[0].name);
          }
          return false;
        }
      ),
    name: useAccountNameRule(async value => {
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
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/secret-key.svg" size={120} />
      </IllustrationContainer>
      <HeaderTextContainer>
        <Typography type="header">
          <Trans t={t}>Import account by uploading a file</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>Import your account from Secret Key File.</Trans>
        </Typography>
      </TextContainer>
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputsContainer>
          <Input
            type="file"
            accept=".pem"
            prefixIcon={<SvgIcon src="assets/icons/file.svg" />}
            suffixIcon={
              isFileLoaded && (
                <SvgIcon
                  onClick={() =>
                    setValue('secretKeyFile', null, { shouldValidate: true })
                  }
                  src="assets/icons/close-filter.svg"
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
