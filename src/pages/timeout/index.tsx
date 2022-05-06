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

import { selectVaultTimeoutDurationSetting } from '@src/redux/vault/selectors';
import { changeTimeoutDuration } from '@src/redux/vault/actions';
import { TimeoutDurationSetting } from '@src/app/constants';

export function TimeoutPageContent() {
  const { t } = useTranslation();
  const timeoutDuration = useSelector(selectVaultTimeoutDurationSetting);
  const dispatch = useDispatch();

  const MapTimeoutDurationSettingToTranslation = {
    [TimeoutDurationSetting['1 min']]: t('1 min'),
    [TimeoutDurationSetting['5 min']]: t('5 min'),
    [TimeoutDurationSetting['15 min']]: t('15 min'),
    [TimeoutDurationSetting['30 min']]: t('30 min'),
    [TimeoutDurationSetting['1 hour']]: t('1 hour'),
    [TimeoutDurationSetting['24 hours']]: t('24 hours')
  };

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Timeout</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
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
                  <Trans
                    t={t}
                    i18nKey={key}
                    values={MapTimeoutDurationSettingToTranslation}
                  />
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
