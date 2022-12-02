import React, { useCallback } from 'react';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { FieldValues, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import * as Yup from 'yup';
import { Trans, useTranslation } from 'react-i18next';

import {
  LayoutWindow,
  PopupHeader,
  FooterButtonsContainer
} from '@src/libs/layout';
import { Button } from '@src/libs/ui';
import { useAccountNameRule } from '@src/libs/ui/forms/form-validation-rules';

import { Account } from '@src/background/redux/vault/types';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { accountImported } from '@src/background/redux/vault/actions';
import { checkAccountNameIsTaken } from '@src/background/redux/import-account-actions-should-be-removed';

import { RouterPath, useTypedNavigate } from '../../router';
import { useSecretKeyFileReader } from './hooks/use-secret-key-file-reader';

import { ImportAccountWithFileUploadPageContent } from './content';

export type ImportAccountFormValues = {
  secretKeyFile: string | undefined;
  name: string;
};

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
    setValue,
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
      renderHeader={() => <PopupHeader />}
      renderContent={() => (
        <ImportAccountWithFileUploadPageContent
          register={register}
          setValue={setValue}
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
