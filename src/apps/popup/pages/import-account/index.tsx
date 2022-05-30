import React, { useCallback, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useDispatch } from 'react-redux';
import Browser, { Runtime } from 'webextension-polyfill';
import MessageSender = Runtime.MessageSender;

import {
  useTypedNavigate,
  PurposeForOpening,
  useWindowManager
} from '@src/hooks';
import {
  ContentContainer,
  ButtonsContainer,
  HeaderTextContainer,
  TextContainer
} from '@layout/containers';
import { Typography, Button } from '@libs/ui';
import { importAccount } from '@popup/redux/vault/actions';

import { RouterPath } from '@popup/router';

export function ImportAccountContentPage() {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Import account from secret key file</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          <Trans t={t}>
            Please note, accounts imported with a file will not be associated
            with your originally created Casper Signer secret recovery phrase.
          </Trans>
        </Typography>
      </TextContainer>
      <ButtonsContainer>
        <Button onClick={() => navigate(RouterPath.ImportAccountWithFile)}>
          <Trans t={t}>Upload your file</Trans>
        </Button>
      </ButtonsContainer>
    </ContentContainer>
  );
}

export function ImportAccountWithFileProcessContentPage() {
  const dispatch = useDispatch();
  const { openWindow } = useWindowManager();
  const { t } = useTranslation();

  const handleMessage = useCallback(
    async (message: any, sender: MessageSender) => {
      if (message.success) {
        const { account } = message;
        dispatch(importAccount(account));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    openWindow(PurposeForOpening.ImportAccount).catch(e => console.log(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      Browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [handleMessage]);

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Finish process in separated window</Trans>
        </Typography>
      </HeaderTextContainer>
    </ContentContainer>
  );
}
