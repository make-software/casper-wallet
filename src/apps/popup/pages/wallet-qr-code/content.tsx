import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { QRCodeCanvas } from 'qrcode.react';
import { aes_256_cbc } from '@noble/ciphers/webcrypto/aes';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  Input,
  PasswordInputType,
  PasswordVisibilityIcon,
  Typography
} from '@libs/ui';
import { CreatePasswordForQRCodeFormValues } from '@libs/ui/forms/create-password-for-qr-code';
import { shallowEqual, useSelector } from 'react-redux';
import {
  selectSecretPhrase,
  selectVaultDerivedAccounts,
  selectVaultImportedAccounts
} from '@background/redux/vault/selectors';
import {
  aesEncryptString,
  getBip44Path,
  secretPhraseToSeed
} from '@libs/crypto';
import { HDKey } from '@scure/bip32';
import { convertBytesToBase64, convertBytesToHex } from '@libs/crypto/utils';
import { sagaSelect } from '@background/redux/utils';
import { selectEncryptionKeyHash } from '@background/redux/session/selectors';
import {
  encodePassword,
  generateRandomSaltBytes,
  generateRandomSaltHex
} from '@libs/crypto/hashing';
import { randomBytes } from '@noble/hashes/utils';

interface WalletQrCodePageContentProps {
  isQRGenerated: boolean;
  register: UseFormRegister<CreatePasswordForQRCodeFormValues>;
  errors: FieldErrors<CreatePasswordForQRCodeFormValues>;
}

export const WalletQrCodePageContent = ({
  isQRGenerated,
  register,
  errors
}: WalletQrCodePageContentProps) => {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const { t } = useTranslation();

  const secretPhrase = useSelector(selectSecretPhrase);
  const derivedAccounts = useSelector(selectVaultDerivedAccounts, shallowEqual);
  const importedAccounts = useSelector(
    selectVaultImportedAccounts,
    shallowEqual
  );
  const [qr, setQr] = useState('');

  useEffect(() => {
    (async () => {
      if (secretPhrase) {
        const salt = randomBytes(16);
        const iv = randomBytes(16);
        const key = await pbkdf2Async(sha256, 'password', salt, {
          c: 5000,
          dkLen: 32
        });

        const str = JSON.stringify([
          secretPhrase.join(' '),
          derivedAccounts.map(da => da.name),
          [
            ...importedAccounts.map(acc => ({
              secretKey: acc.secretKey,
              label: acc.name
            }))
          ]
        ]);

        const data = Uint8Array.from(Buffer.from(str));

        const stream = aes_256_cbc(key, iv);

        const chipher = await stream.encrypt(data);
        console.log('-------- iv', iv.toString());
        console.log('-------- chipher', chipher.toString());
        const q = JSON.stringify([
          convertBytesToBase64(chipher),
          convertBytesToBase64(salt),
          convertBytesToBase64(iv)
        ]);
        console.log('-------- q', q);

        const qB = Uint8Array.from(Buffer.from(q));
        console.log('-------- qB', qB);
        const r = convertBytesToBase64(qB);
        console.log('-------- r', r);
        setQr(r);
      }
    })();
  }, []);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>
            {isQRGenerated ? 'QR code is ready!' : 'Create a one time password'}
          </Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body">
          <Trans t={t}>
            {isQRGenerated
              ? 'Scan this with your Casper Wallet app.'
              : 'You’ll need to enter this password on another device only once after scanning QR code.'}
          </Trans>
        </Typography>
      </ParagraphContainer>
      <VerticalSpaceContainer top={SpacingSize.Large}>
        {/* TODO: add QR code instead of null */}
        {!!qr && (
          <QRCodeCanvas
            id="qrCode"
            value={qr}
            size={300}
            bgColor={'#00ff00'}
            level={'H'}
          />
        )}
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
