import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Typography, Checkbox, List } from '@libs/ui';
import {
  ContentContainer,
  ParagraphContainer,
  ListItemClickableContainer
} from '@src/libs/layout/containers';

import { TimeoutDurationSetting } from '@popup/constants';
import { dispatchToMainStore } from '../../../../background/redux/utils';
import { selectTimeoutDurationSetting } from '@src/background/redux/timeout-duration-setting/selectors';
import { timeoutDurationSettingChanged } from '@src/background/redux/timeout-duration-setting/actions';

export function TimeoutPageContent() {
  const { t } = useTranslation();
  const timeoutDurationSetting = useSelector(selectTimeoutDurationSetting);

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
      <ParagraphContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Timeout</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Your wallet will automatically lock after some period of inactivity.
            Select the desired duration.
          </Trans>
        </Typography>
      </ParagraphContainer>
      <List
        rows={timeoutsMenuItems}
        marginLeftForItemSeparatorLine={16}
        renderRow={menuItem => (
          <ListItemClickableContainer
            key={menuItem.id}
            onClick={() => {
              dispatchToMainStore(
                timeoutDurationSettingChanged(
                  TimeoutDurationSetting[menuItem.id]
                )
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
