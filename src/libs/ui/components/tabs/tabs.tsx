import React, { ReactNode } from 'react';
import styled from 'styled-components';

import { Typography } from '@libs/ui';
import { AlignedSpaceBetweenFlexRow, CenteredFlexRow } from '@libs/layout';

const TabsContainer = styled(AlignedSpaceBetweenFlexRow)`
  height: 40px;
  background-color: ${({ theme }) => theme.color.fillSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.twenty}px;
  padding: 4px;
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
  const [activeTabId, setActiveTabId] = React.useState(0);

  return (
    <TabsContainer>
      {children.map((tab, index) => {
        const { tabName } = tab.props;

        return activeTabId === index ? (
          <ActiveTabContainer title={tabName} key={tabName}>
            <Typography type="captionMedium">{tabName}</Typography>
          </ActiveTabContainer>
        ) : (
          <TabContainer
            onClick={() => {
              if (tabName === 'NFTs') return;
              setActiveTabId(index);
            }}
            disable={tabName === 'NFTs'}
            title={tabName === 'NFTs' ? 'Coming Soon' : tabName}
            key={tabName}
          >
            <Typography type="captionRegular">{tabName}</Typography>
          </TabContainer>
        );
      })}
    </TabsContainer>
  );
}
