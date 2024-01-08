import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isSafariBuild } from '@src/utils';

import { themeModeSettingChanged } from '@background/redux/settings/actions';
import { selectThemeModeSetting } from '@background/redux/settings/selectors';
import { ThemeMode } from '@background/redux/settings/types';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  AlignedFlexRow,
  ContentContainer,
  FlexColumn,
  FooterButtonsContainer,
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { Button, List, SvgIcon, Typography } from '@libs/ui';

const Container = styled(FlexColumn)`
  padding-top: 24px;

  background-color: ${({ theme }) => theme.color.backgroundSecondary};
  border-top-right-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  border-top-left-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
`;

const Plate = styled(SpaceBetweenFlexRow)`
  padding: 16px;

  cursor: pointer;
`;

interface ThemeSwitcherProps {
  closeSwitcher: (e: React.MouseEvent<Element, MouseEvent>) => void;
}

export const ThemeSwitcher = ({ closeSwitcher }: ThemeSwitcherProps) => {
  const { t } = useTranslation();

  const themeMode = useSelector(selectThemeModeSetting);

  const listOfThemes = useMemo(
    () =>
      isSafariBuild
        ? [
            {
              id: 1,
              name: ThemeMode.DARK,
              icon: 'assets/icons/moon.svg',
              isActive: themeMode === ThemeMode.DARK
            },
            {
              id: 2,
              name: ThemeMode.LIGHT,
              icon: 'assets/icons/sun.svg',
              isActive: themeMode === ThemeMode.LIGHT
            }
          ]
        : [
            {
              id: 1,
              name: ThemeMode.SYSTEM,
              icon: 'assets/icons/theme.svg',
              isActive: themeMode === ThemeMode.SYSTEM
            },
            {
              id: 2,
              name: ThemeMode.DARK,
              icon: 'assets/icons/moon.svg',
              isActive: themeMode === ThemeMode.DARK
            },
            {
              id: 3,
              name: ThemeMode.LIGHT,
              icon: 'assets/icons/sun.svg',
              isActive: themeMode === ThemeMode.LIGHT
            }
          ],
    [themeMode]
  );

  const changeTheme = (themeMode: ThemeMode) => {
    dispatchToMainStore(themeModeSettingChanged(themeMode));
  };

  return (
    <Container gap={SpacingSize.Small}>
      <ContentContainer>
        <ParagraphContainer>
          <Typography type="header">
            <Trans t={t}>Theme</Trans>
          </Typography>
        </ParagraphContainer>
        <List
          contentTop={SpacingSize.XL}
          rows={listOfThemes}
          renderRow={item => (
            <Plate onClick={() => changeTheme(item.name)}>
              <AlignedFlexRow gap={SpacingSize.Large}>
                <SvgIcon src={item.icon} color="contentAction" />
                <Typography type="body">{item.name}</Typography>
              </AlignedFlexRow>
              <SvgIcon
                src={
                  item.isActive
                    ? 'assets/icons/radio-button-on.svg'
                    : 'assets/icons/radio-button-off.svg'
                }
              />
            </Plate>
          )}
          marginLeftForItemSeparatorLine={56}
        />
      </ContentContainer>
      <FooterButtonsContainer>
        <Button onClick={closeSwitcher}>
          <Trans t={t}>Done</Trans>
        </Button>
      </FooterButtonsContainer>
    </Container>
  );
};
