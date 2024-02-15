import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import React, { useCallback } from 'react';
import { FieldValues, UseFormProps, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { checkAccountNameIsTaken } from '@background/redux/import-account-actions-should-be-removed';
import { dispatchToMainStore } from '@background/redux/utils';
import { accountImported } from '@background/redux/vault/actions';

import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow
} from '@libs/layout';
import { Account } from '@libs/types/account';
import { Button } from '@libs/ui/components';
import { useAccountNameRule } from '@libs/ui/forms/form-validation-rules';

import { RouterPath, useTypedNavigate } from '../../router';
import { ImportAccountWithFileUploadPageContent } from './content';
import { useSecretKeyFileReader } from './hooks/use-secret-key-file-reader';
import { ImportAccountFormValues } from './types';

export function ImportAccountWithFileUploadPage() {
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
            return /\.pem$|\.cer$/.test(filesArray[0].name);
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

  const formOptions: UseFormProps<ImportAccountFormValues> = {
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: {
      secretKeyFile: undefined,
      name: ''
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    resetField,
    formState: { errors, isValid, isDirty }
  } = useForm<ImportAccountFormValues>(formOptions);

  async function onSubmit({
    secretKeyFile: { 0: secretKeyFile },
    name
  }: FieldValues) {
    secretKeyFileReader(name, secretKeyFile);
  }

  const isSubmitDisabled = !isValid || !isDirty;
  const secretKeyFile = watch('secretKeyFile');
  const isFileLoaded = secretKeyFile != null && secretKeyFile.length > 0;

  return (
    <LayoutWindow
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={() => <HeaderPopup />}
      renderContent={() => (
        <ImportAccountWithFileUploadPageContent
          register={register}
          resetField={resetField}
          isFileLoaded={isFileLoaded}
          errors={errors}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button disabled={isSubmitDisabled}>
            <Trans t={t}>Import</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
