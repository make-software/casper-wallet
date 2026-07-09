import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { dismissSagaError } from '@background/redux/app-events/actions';
import { selectSagaErrors } from '@background/redux/app-events/selectors';
import { SagaError } from '@background/redux/app-events/types';
import { dispatchToMainStore } from '@background/redux/utils';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

const BannerContainer = styled(FlexColumn)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 360px;
  z-index: ${({ theme }) => theme.zIndex.tooltip};

  max-height: 100vh;
  overflow-y: auto;

  background: ${({ theme }) => theme.color.backgroundPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.color.borderPrimary};
  box-shadow: ${({ theme }) => theme.shadow.contextMenu};
`;

const ErrorRow = styled(AlignedFlexRow)`
  align-items: flex-start;
  padding: 12px 16px;

  border-bottom: 1px solid ${({ theme }) => theme.color.borderPrimary};

  &:last-child {
    border-bottom: none;
  }
`;

const ErrorTextContainer = styled(FlexColumn)`
  flex: 1;
  min-width: 0;
  word-break: break-word;
`;

const DismissButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  margin-left: auto;

  border: none;
  background: none;

  cursor: pointer;
`;

export const SagaErrorBanner = () => {
  const { t } = useTranslation();

  const errors = useSelector(selectSagaErrors);

  if (errors.length === 0) {
    return null;
  }

  const handleDismiss = (id: SagaError['id']) => {
    dispatchToMainStore(dismissSagaError(id));
  };

  return (
    <BannerContainer role="alert">
      {errors.map(error => (
        <ErrorRow key={error.id} gap={SpacingSize.Small}>
          <SvgIcon
            src="assets/icons/error.svg"
            size={20}
            color="contentActionCritical"
          />
          <ErrorTextContainer gap={SpacingSize.Tiny}>
            <Typography type="bodySemiBold">
              <Trans t={t}>Something went wrong</Trans>
            </Typography>
            <Typography type="captionRegular" color="contentSecondary">
              {error.source}: {error.message}
            </Typography>
          </ErrorTextContainer>
          <DismissButton
            type="button"
            aria-label={'dismiss'}
            title={'dismiss'}
            onClick={() => handleDismiss(error.id)}
          >
            <SvgIcon src="assets/icons/close.svg" size={16} />
          </DismissButton>
        </ErrorRow>
      ))}
    </BannerContainer>
  );
};
