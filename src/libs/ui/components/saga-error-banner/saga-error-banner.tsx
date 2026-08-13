import React, { useSyncExternalStore } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { dismissSagaError } from '@background/redux/app-events/actions';
import { selectSagaErrors } from '@background/redux/app-events/selectors';
import { SagaError } from '@background/redux/app-events/types';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  AlignedFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout/containers';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';
import { Typography } from '@libs/ui/components/typography/typography';

import {
  UiError,
  UiErrorKind,
  dismissUiError,
  getUiErrorsServerSnapshot,
  getUiErrorsSnapshot,
  subscribeToUiErrors
} from './ui-error-channel';

const BannerContainer = styled(FlexColumn)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
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

// The channel carries a `kind`, not a string, so the copy lives here where `t`
// does. Unlike `SagaError.message` — produced in the background and rendered
// verbatim and untranslated — these lines are ours to write.
//
// Literal `<Trans>` per kind rather than a lookup keyed on `kind`: a dynamic key
// is invisible to i18next-parser, so these two strings would never reach any
// catalog.
//
// The dispatch copy claims neither that nothing changed nor that retrying helps.
// Both would be false somewhere: `handleReduxAction` dispatches `resetVault`
// before awaiting `enableOnboardingFlow`, so a rejection can arrive with the
// vault already wiped, and `use-ledger` sets `triggeredRef` right after its
// dispatch, so that effect cannot re-run.
const UiErrorMessage = ({ kind }: { kind: UiErrorKind }) => {
  const { t } = useTranslation();

  if (kind === 'dispatch-failed') {
    return (
      <Trans t={t}>
        The wallet didn&apos;t respond. Your last action may not have been
        applied.
      </Trans>
    );
  }

  return <Trans t={t}>Couldn&apos;t open the window. Please try again.</Trans>;
};

export const SagaErrorBanner = () => {
  const { t } = useTranslation();

  const errors = useSelector(selectSagaErrors);
  const uiErrors = useSyncExternalStore(
    subscribeToUiErrors,
    getUiErrorsSnapshot,
    // Required: this component is rendered with `renderToStaticMarkup` in tests.
    getUiErrorsServerSnapshot
  );

  if (errors.length === 0 && uiErrors.length === 0) {
    return null;
  }

  const handleDismiss = (id: SagaError['id']) => {
    dispatchToMainStore(dismissSagaError(id));
  };

  const handleDismissUiError = (id: UiError['id']) => {
    dismissUiError(id);
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
            aria-label={t('Dismiss')}
            title={t('Dismiss')}
            onClick={() => handleDismiss(error.id)}
          >
            <SvgIcon src="assets/icons/close.svg" size={16} />
          </DismissButton>
        </ErrorRow>
      ))}
      {uiErrors.map(uiError => (
        <ErrorRow key={`ui-${uiError.id}`} gap={SpacingSize.Small}>
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
              <UiErrorMessage kind={uiError.kind} />
            </Typography>
          </ErrorTextContainer>
          <DismissButton
            type="button"
            aria-label={t('Dismiss')}
            title={t('Dismiss')}
            onClick={() => handleDismissUiError(uiError.id)}
          >
            <SvgIcon src="assets/icons/close.svg" size={16} />
          </DismissButton>
        </ErrorRow>
      ))}
    </BannerContainer>
  );
};
