import { Player } from '@lottiefiles/react-lottie-player';
import React, { SetStateAction } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import spinnerDarkModeAnimation from '@libs/animations/spinner_dark_mode.json';
import spinnerLightModeAnimation from '@libs/animations/spinner_light_mode.json';
import {
  CenteredFlexColumn,
  SpacingSize,
  TabPageContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import { AccountListRows } from '@libs/types/account';
import {
  DynamicAccountsListWithSelect,
  Tile,
  Typography
} from '@libs/ui/components';

const AnimationContainer = styled(CenteredFlexColumn)`
  padding: 106px 16px;
`;

interface SelectAccountsToRecoverContentProps {
  isLoading: boolean;
  derivedAccountsWithBalance: AccountListRows[];
  isLoadingMore: boolean;
  onLoadMore: () => void;
  maxItemsToRender: number;
  setSelectedAccounts: React.Dispatch<SetStateAction<AccountListRows[]>>;
  selectedAccounts: AccountListRows[];
  setIsButtonDisabled: React.Dispatch<SetStateAction<boolean>>;
}

export const SelectAccountsToRecoverContent = ({
  isLoading,
  isLoadingMore,
  onLoadMore,
  derivedAccountsWithBalance,
  maxItemsToRender,
  setSelectedAccounts,
  selectedAccounts,
  setIsButtonDisabled
}: SelectAccountsToRecoverContentProps) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  return (
    <TabPageContainer>
      <Typography type="captionMedium" color="contentActionCritical" uppercase>
        <Trans t={t}>Step 4</Trans>
      </Typography>
      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Typography type="headerBig">
          <Trans t={t}>Select accounts to recover</Trans>
        </Typography>
      </VerticalSpaceContainer>

      {isLoading ? (
        <VerticalSpaceContainer top={SpacingSize.XL}>
          <Tile>
            <AnimationContainer>
              <Player
                renderer="svg"
                autoplay
                loop
                src={
                  isDarkMode
                    ? spinnerDarkModeAnimation
                    : spinnerLightModeAnimation
                }
                style={{ height: '130px' }}
              />
              <CenteredFlexColumn gap={SpacingSize.Small}>
                <Typography type="subtitle">
                  <Trans t={t}>Just a moment</Trans>
                </Typography>
                <Typography
                  type="captionRegular"
                  color="contentSecondary"
                  style={{ textAlign: 'center' }}
                >
                  <Trans t={t}>Your accounts will be here shortly.</Trans>
                </Typography>
              </CenteredFlexColumn>
            </AnimationContainer>
          </Tile>
        </VerticalSpaceContainer>
      ) : (
        <DynamicAccountsListWithSelect
          accountsWithBalance={derivedAccountsWithBalance}
          isLoadingMore={isLoadingMore}
          onLoadMore={onLoadMore}
          maxItemsToRender={maxItemsToRender}
          setSelectedAccounts={setSelectedAccounts}
          selectedAccounts={selectedAccounts}
          setIsButtonDisabled={setIsButtonDisabled}
          namePrefix="Account"
        />
      )}
    </TabPageContainer>
  );
};
