import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Typography, Checkbox, List } from '~src/libs/ui';
import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer,
  ListItemClickableContainer
} from '~src/libs/layout/containers';

import { selectVaultTimeoutDurationSetting } from '~src/libs/redux/vault/selectors';
import { timeoutDurationChanged } from '~src/libs/redux/vault/actions';
import { TimeoutDurationSetting } from '~src/libs/redux/vault/types';
import { dispatchToMainStore } from '../../../../libs/redux/utils';

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
              dispatchToMainStore(
                timeoutDurationChanged({
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
