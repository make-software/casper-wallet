import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { FieldValues, useForm } from 'react-hook-form';

import Hex from '@lapo/asn1js/hex';
import Base64 from '@lapo/asn1js/base64';
import ASN1 from '@lapo/asn1js';
import { encodeBase64 } from 'tweetnacl-util';
import { decodeBase16, decodeBase64, Keys } from 'casper-js-sdk';

import { browser } from 'webextension-polyfill-ts';

import { useTypedNavigate } from '@src/hooks';

import {
  ButtonsContainer,
  ContentContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@layout/containers';
import { Button, Input, SvgIcon, Typography } from '@libs/ui';
import { RouterPath } from '@import-account-with-file/paths';

import {
  selectVaultAccountNames,
  selectVaultAccountPrivateKeysBase64
} from '@libs/redux/vault/selectors';

function getAlgorithm(content: string): 'Ed25519' | 'Secp256K1' | undefined {
  if (content.includes('curveEd25519')) {
    return 'Ed25519';
  } else if (content.includes('secp256k1')) {
    return 'Secp256K1';
  }
  return undefined;
}

export function ImportAccountWithFileContentPage() {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const existingAccountNames = useSelector(selectVaultAccountNames);
  const existingPrivateKeys = useSelector(selectVaultAccountPrivateKeysBase64);

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
      .test('unique', 'Account name is already taken', value => {
        return !existingAccountNames.includes(value as string);
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
    const reader = new FileReader();
    reader.readAsText(secretKeyFile);

    reader.onload = async e => {
      const fileContents = reader.result as string;

      if (!fileContents || fileContents.includes('PUBLIC KEY')) {
        console.log("There isn't private key in file");
        navigate(RouterPath.ImportAccountWithFileFailure);

        return;
      }

      const reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
      try {
        const der: Uint8Array = reHex.test(fileContents)
          ? Hex.decode(fileContents)
          : Base64.unarmor(fileContents);

        const decodedString = ASN1.decode(der).toPrettyString();
        const algorithm = getAlgorithm(decodedString);

        if (!algorithm) {
          console.log('Unknown algorithm');
          navigate(RouterPath.ImportAccountWithFileFailure);

          return;
        }

        const hexKey =
          algorithm === 'Ed25519'
            ? decodedString.split('\n')[4].split('|')[1]
            : decodedString.split('\n')[2].split('|')[1];

        const secretKeyBase64 = encodeBase64(decodeBase16(hexKey));

        console.log('existingPrivateKeys', existingPrivateKeys);
        console.log('secretKeyBase64', secretKeyBase64);

        if (existingPrivateKeys.includes(secretKeyBase64)) {
          console.log('Private key is already exists');
          navigate(RouterPath.ImportAccountWithFileFailure);

          return;
        }

        const secretKeyBytes = decodeBase64(secretKeyBase64);

        const secretKey =
          algorithm === 'Ed25519'
            ? Keys.Ed25519.parsePrivateKey(secretKeyBytes)
            : Keys.Secp256K1.parsePrivateKey(secretKeyBytes, 'raw');
        const publicKey =
          algorithm === 'Ed25519'
            ? Keys.Ed25519.privateToPublicKey(secretKeyBytes)
            : Keys.Secp256K1.privateToPublicKey(secretKeyBytes);
        const keyPair =
          algorithm === 'Ed25519'
            ? Keys.Ed25519.parseKeyPair(publicKey, secretKey)
            : Keys.Secp256K1.parseKeyPair(publicKey, secretKey, 'raw');

        await browser.runtime.sendMessage({
          success: true,
          account: {
            name: name,
            keyPair,
            isBackedUp: true
          }
        });

        navigate(RouterPath.ImportAccountWithFileSuccess);
      } catch (e) {
        console.log(e);
        navigate(RouterPath.ImportAccountWithFileFailure);
      }
    };
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
