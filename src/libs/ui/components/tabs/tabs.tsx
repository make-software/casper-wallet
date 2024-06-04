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
  width: calc(33% - 8px);
  border-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  padding: 4px 8px;
`;

const TabContainer = styled(CenteredFlexRow)<{ disable?: boolean }>`
  cursor: ${({ disable }) => (disable ? 'not-allowed' : 'pointer')};
  width: calc(33% - 8px);
  padding: 4px 8px;
`;

export const HomePageTabsId = {
  Tokens: 0,
  Deploys: 1,
  NFTs: 2
};

export const Tab = styled.div<TabProps>``;

interface TabProps {
  tabName: string;
  children?: ReactNode;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
  preferActiveTabId?: number;
}

export function Tabs({ children, preferActiveTabId }: TabsProps) {
  // set preferActiveTabId as the default value if it is provided. We do not need to track props change, so we can set it directly in useState
  const [activeTabId, setActiveTabId] = useState(preferActiveTabId || 0);

  const { t } = useTranslation();

  return (
    <>
      <StickyTabsContainer>
        <TabsContainer flexGrow={1}>
          {children.map((tab, index) => {
            const { tabName } = tab.props;

            return activeTabId === index ? (
              <ActiveTabContainer title={tabName} key={tabName}>
                <Typography type="captionMedium">
                  <Trans t={t}>{tabName}</Trans>
                </Typography>
              </ActiveTabContainer>
            ) : (
              <TabContainer
                onClick={() => {
                  setActiveTabId(index);
                }}
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

      {children.map((tab, index) =>
        activeTabId === index ? tab.props.children : null
      )}
    </>
  );
}
