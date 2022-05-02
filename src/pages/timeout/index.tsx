import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import {
  ListItemElementContainer,
  Typography,
  Checkbox,
  List
} from '@src/libs/ui';
import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';

import { selectTimeoutDuration } from '@src/redux/vault/selectors';
import { changeTimeout } from '@src/redux/vault/actions';
import { Timeout } from '@src/app/types';

export function TimeoutPageContent() {
  const { t } = useTranslation();
  const timeoutDuration = useSelector(selectTimeoutDuration);
  const dispatch = useDispatch();

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Timeout</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" variation="contentSecondary">
          <Trans t={t}>
            Your vault will be automatically locked after some period of
            inactivity.
          </Trans>
        </Typography>
        <List
          listItems={(Object.keys(Timeout) as Array<keyof typeof Timeout>).map(
            key => ({
              id: Timeout[key],
              Content: (
                <ListItemElementContainer>
                  <Typography type="body" weight="regular">
                    <Trans t={t}>{Timeout[key]}</Trans>
                  </Typography>
                </ListItemElementContainer>
              ),
              Right: (
                <ListItemElementContainer>
                  <Checkbox checked={timeoutDuration === Timeout[key]} />
                </ListItemElementContainer>
              ),
              onClick: () => {
                dispatch(
                  changeTimeout({
                    timeoutDuration: Timeout[key],
                    timeoutStartTime: Date.now()
                  })
                );
              }
            })
          )}
        />
      </TextContainer>
    </ContentContainer>
  );
}
