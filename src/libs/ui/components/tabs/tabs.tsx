import React, { ReactNode, useState } from 'react';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';

import { Typography, Tooltip } from '@libs/ui';
import { AlignedSpaceBetweenFlexRow, CenteredFlexRow } from '@libs/layout';

const TabsContainer = styled(AlignedSpaceBetweenFlexRow)`
  height: 40px;
  background-color: ${({ theme }) => theme.color.fillSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.twenty}px;
  padding: 4px;
`;

const StickyTabsContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;

  padding: 16px 0;

  background-color: ${({ theme }) => theme.color.backgroundSecondary};
`;

const ActiveTabContainer = styled(CenteredFlexRow)`
  cursor: pointer;
  width: calc(33% - 8px);
  border-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  background-color: ${({ theme }) => theme.color.fillWhite};
  padding: 4px 8px;
`;

const TabContainer = styled(CenteredFlexRow)<{ disable?: boolean }>`
  cursor: ${({ disable }) => (disable ? 'not-allowed' : 'pointer')};
  width: calc(33% - 8px);
  padding: 4px 8px;
`;

export const Tab = styled.div<TabProps>``;

interface TabProps {
  tabName: string;
  children?: ReactNode;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
}

export function Tabs({ children }: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(0);

  const { t } = useTranslation();

  return (
    <>
      <StickyTabsContainer>
        <TabsContainer>
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
                  if (tabName === 'NFTs') return;
                  setActiveTabId(index);
                }}
                disable={tabName === 'NFTs'}
                key={tabName}
              >
                <Tooltip
                  title={tabName === 'NFTs' ? 'Coming Soon' : null}
                  noWrap
                >
                  <Typography type="captionRegular">
                    <Trans t={t}>{tabName}</Trans>
                  </Typography>
                </Tooltip>
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
