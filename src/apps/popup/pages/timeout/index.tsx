import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Typography, Checkbox, List } from '@libs/ui';
import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer,
  ListItemClickableContainer
} from '@layout/containers';

import { selectVaultTimeoutDurationSetting } from '@popup/redux/vault/selectors';
import { changeTimeoutDuration } from '@popup/redux/vault/actions';
import { TimeoutDurationSetting } from '@popup/constants';

export function TimeoutPageContent() {
  const { t } = useTranslation();
  const timeoutDurationSetting = useSelector(selectVaultTimeoutDurationSetting);
  const dispatch = useDispatch();

  const timeoutsMenuItems = useMemo(() => {
    const timeoutDurationSettingTranslationDict = {
      [TimeoutDurationSetting['1 min']]: t('1 min'),
      [TimeoutDurationSetting['5 min']]: t('5 min'),
      [TimeoutDurationSetting['15 min']]: t('15 min'),
      [TimeoutDurationSetting['30 min']]: t('30 min'),
      [TimeoutDurationSetting['1 hour']]: t('1 hour'),
      [TimeoutDurationSetting['24 hours']]: t('24 hours')
    };

    return (
      Object.keys(TimeoutDurationSetting) as Array<
        keyof typeof TimeoutDurationSetting
      >
    ).map(timeoutDurationItem => ({
      id: timeoutDurationItem,
      title: timeoutDurationSettingTranslationDict[timeoutDurationItem],
      checked: timeoutDurationSetting === timeoutDurationItem
    }));
  }, [t, timeoutDurationSetting]);

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
      </TextContainer>
      <List
        rows={timeoutsMenuItems}
        marginLeftForItemSeparatorLine={16}
        renderRow={menuItem => (
          <ListItemClickableContainer
            key={menuItem.id}
            onClick={() => {
              dispatch(
                changeTimeoutDuration({
                  timeoutDuration: TimeoutDurationSetting[menuItem.id]
                })
              );
            }}
          >
            <Typography type="body" weight="regular">
              {menuItem.title}
            </Typography>
            <Checkbox checked={timeoutDurationSetting === menuItem.id} />
          </ListItemClickableContainer>
        )}
      />
    </ContentContainer>
  );
}
