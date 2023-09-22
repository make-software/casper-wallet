import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { QRCodeCanvas } from 'qrcode.react';

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

interface WalletQrCodePageContentProps {
  qrString: string;
  register: UseFormRegister<CreatePasswordForQRCodeFormValues>;
  errors: FieldErrors<CreatePasswordForQRCodeFormValues>;
}

export const WalletQrCodePageContent = ({
  qrString,
  register,
  errors
}: WalletQrCodePageContentProps) => {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>
            {qrString ? 'QR code is ready!' : 'Create a one time password'}
          </Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body">
          <Trans t={t}>
            {qrString
              ? 'Scan this with your Casper Wallet app.'
              : 'You’ll need to enter this password on another device only once after scanning QR code.'}
          </Trans>
        </Typography>
      </ParagraphContainer>
      <VerticalSpaceContainer top={SpacingSize.Large}>
        {qrString ? (
          <QRCodeCanvas
            id="qrCode"
            value={qrString}
            size={300}
            bgColor={'#ffffff'}
            level={'H'}
          />
        ) : (
          <Input
            type={passwordInputType}
            placeholder={t('Password')}
            error={!!errors.password}
            validationText={errors.password?.message}
            suffixIcon={
              <PasswordVisibilityIcon
                passwordInputType={passwordInputType}
                setPasswordInputType={setPasswordInputType}
              />
            }
            {...register('password')}
          />
        )}
      </VerticalSpaceContainer>
    </ContentContainer>
  );
};
