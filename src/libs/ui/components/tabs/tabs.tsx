import React, { ReactNode, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AlignedSpaceBetweenFlexRow, CenteredFlexRow } from '@libs/layout';
import { Typography } from '@libs/ui/components';

const TabsContainer = styled(AlignedSpaceBetweenFlexRow)`
  height: 40px;
  background: ${({ theme }) => theme.color.fillNeutral};
  border-radius: ${({ theme }) => theme.borderRadius.twenty}px;
  padding: 4px;
`;

const StickyTabsContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;

  padding: 16px 0;

  background-color: ${({ theme }) => theme.color.backgroundSecondary};
`;

const ActiveTabContainer = styled(CenteredFlexRow)`
  cursor: pointer;
  flex: 1;
  border-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  padding: 4px 8px;
`;

const TabContainer = styled(CenteredFlexRow)<{ disable?: boolean }>`
  cursor: ${({ disable }) => (disable ? 'not-allowed' : 'pointer')};
  flex: 1;
  padding: 4px 8px;
`;

export const Tab = styled.div<TabProps>``;

interface TabProps {
  tabName: string;
  children?: ReactNode;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
  /**
   * When provided, the parent owns the active tab. Without it the component
   * keeps its own state and starts on the first tab.
   */
  activeTabName?: string;
  onTabChange?: (tabName: string) => void;
  onClick?: () => void;
}

export function Tabs({
  children,
  activeTabName,
  onTabChange,
  onClick
}: TabsProps) {
  const firstTabName = children[0].props.tabName;

  const [uncontrolledTabName, setUncontrolledTabName] = useState(firstTabName);

  const requestedTabName = activeTabName ?? uncontrolledTabName;
  // Fall back to the first tab rather than rendering nothing if the requested
  // name matches no child.
  const currentTabName = children.some(
    tab => tab.props.tabName === requestedTabName
  )
    ? requestedTabName
    : firstTabName;

  const { t } = useTranslation();

  const handleTabClick = (tabName: string) => {
    setUncontrolledTabName(tabName);

    if (onTabChange) {
      onTabChange(tabName);
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <StickyTabsContainer>
        <TabsContainer flexGrow={1}>
          {children.map(tab => {
            const { tabName } = tab.props;

            return tabName === currentTabName ? (
              <ActiveTabContainer title={tabName} key={tabName}>
                <Typography type="captionMedium">
                  <Trans t={t}>{tabName}</Trans>
                </Typography>
              </ActiveTabContainer>
            ) : (
              <TabContainer
                onClick={() => handleTabClick(tabName)}
                key={tabName}
              >
                <Typography type="captionRegular">
                  <Trans t={t}>{tabName}</Trans>
                </Typography>
              </TabContainer>
            );
          })}
        </TabsContainer>
      </StickyTabsContainer>

      {
        children.find(tab => tab.props.tabName === currentTabName)?.props
          .children
      }
    </>
  );
}
