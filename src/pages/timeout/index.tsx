import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Checkbox, List, Typography } from '@src/libs/ui';
import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';

import { selectVaultTimeoutDurationSetting } from '@src/redux/vault/selectors';
import styled from 'styled-components';
import { changeTimeoutDuration } from '@src/redux/vault/actions';
import { Trans, useTranslation } from 'react-i18next';
import { TimeoutDurationSetting } from '@src/app/constants';

const ListItemElementContainer = styled.div`
  height: 50px;

  display: flex;
  align-items: center;

  &:last-child {
    margin-right: 16px;
  }
`;

export function TimeoutPageContent() {
  const { t } = useTranslation();
  const timeoutDuration = useSelector(selectVaultTimeoutDurationSetting);
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
          listItems={(
            Object.keys(TimeoutDurationSetting) as Array<
              keyof typeof TimeoutDurationSetting
            >
          ).map(key => ({
            id: key,
            Content: (
              <ListItemElementContainer>
                <Typography type="body" weight="regular">
                  <Trans t={t} i18nKey={key} values={Timeout} />
                </Typography>
              </ListItemElementContainer>
            ),
            Right: (
              <ListItemElementContainer>
                <Checkbox checked={timeoutDuration === key} />
              </ListItemElementContainer>
            ),
            onClick: () => {
              dispatch(
                changeTimeoutDuration({
                  timeoutDuration: TimeoutDurationSetting[key]
                })
              );
            }
          }))}
        />
      </TextContainer>
    </ContentContainer>
  );
}
