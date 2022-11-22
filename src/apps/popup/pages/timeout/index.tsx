import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Typography, Checkbox, List } from '@libs/ui';
import {
  ContentContainer,
  TextContainer,
  ListItemClickableContainer
} from '@src/libs/layout/containers';

import { selectVaultTimeoutDurationSetting } from '@src/background/redux/vault/selectors';
import { timeoutDurationChanged } from '@src/background/redux/vault/actions';
import { TimeoutDurationSetting } from '@popup/constants';
import { dispatchToMainStore } from '../../../../background/redux/utils';

export function TimeoutPageContent() {
  const { t } = useTranslation();
  const timeoutDurationSetting = useSelector(selectVaultTimeoutDurationSetting);

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
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Timeout</Trans>
        </Typography>
      </TextContainer>
      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Your wallet will automatically lock after some period of inactivity.
            Select the desired duration.
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
              dispatchToMainStore(
                timeoutDurationChanged({
                  timeoutDuration: TimeoutDurationSetting[menuItem.id]
                })
              );
            }}
          >
            <Typography type="body">{menuItem.title}</Typography>
            <Checkbox checked={timeoutDurationSetting === menuItem.id} />
          </ListItemClickableContainer>
        )}
      />
    </ContentContainer>
  );
}
