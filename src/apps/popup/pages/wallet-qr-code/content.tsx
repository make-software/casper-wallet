import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { QRCodeCanvas } from 'qrcode.react';
import styled, { useTheme } from 'styled-components';

import {
  CenteredFlexRow,
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

const QRContainer = styled(CenteredFlexRow)`
  padding: 20px 16px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
  margin-top: 20px;
`;

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
  const theme = useTheme();

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
      {qrString ? (
        <QRContainer>
          <QRCodeCanvas
            id="qrCode"
            value={qrString}
            size={296}
            bgColor={theme.color.backgroundPrimary}
            level={'H'}
          />
        </QRContainer>
      ) : (
        <VerticalSpaceContainer top={SpacingSize.Large}>
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
        </VerticalSpaceContainer>
      )}
    </ContentContainer>
  );
};
