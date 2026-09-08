import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import { useFetchToken } from 'casper-wallet-core/src/react';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useClickAway } from '@hooks/use-click-away';

import {
  AlignedFlexRow,
  FlexColumn,
  InputsContainer,
  Overlay,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { useSwapDependencies } from '@libs/services/swap-service';
import {
  Input,
  List,
  ModalSwitcher,
  Skeleton,
  SvgIcon,
  Tile,
  Typography
} from '@libs/ui/components';

import {
  filterDexTokens,
  getCustomTokenStatus,
  parseContractHashQuery
} from '../token-selector-utils';
import { TokenSelectorRow } from './token-selector-row';

const SKELETON_ROW_COUNT = 5;

// The list scrolls, the sheet around it must not: 528px of sheet, less the 56px header,
// the 52px title, the 64px search field and the 40px of gaps above the tile.
const LIST_HEIGHT = 312;

// `Modal` is not usable here even though `ModalSwitcher` is: `Modal` owns its open state behind
// its own trigger, and this sheet's open state lives in core's `useSwapTokens`, so the parent
// renders it conditionally instead.
const SheetContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  max-width: 360px;

  box-shadow: ${({ theme }) => theme.shadow.contextMenu};
  border-top-left-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  border-top-right-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
`;

const MessageContainer = styled(VerticalSpaceContainer)`
  padding: 16px;
  text-align: center;
`;

const SkeletonRowContainer = styled(AlignedFlexRow)`
  height: 72px;
  padding: 0 16px;

  justify-content: space-between;
`;

const WarningPanel = styled.div`
  margin-top: 8px;
  padding: 12px 16px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

const renderSkeletonRows = (count: number) =>
  Array.from({ length: count }).map((_, index) => (
    <SkeletonRowContainer key={index}>
      <AlignedFlexRow gap={SpacingSize.Medium}>
        <Skeleton circle width={32} height={32} />
        <FlexColumn>
          <Skeleton width={64} height={14} />
          <Skeleton width={96} height={12} />
        </FlexColumn>
      </AlignedFlexRow>
      <Skeleton circle width={24} height={24} />
    </SkeletonRowContainer>
  ));

export interface TokenSelectorModalProps {
  tokens: IDexToken[] | undefined;
  isLoading: boolean;
  selectedTokenId: string | null;
  onSelect: (token: IDexToken) => void;
  closeModal: () => void;
}

export const TokenSelectorModal = ({
  tokens,
  isLoading,
  selectedTokenId,
  onSelect,
  closeModal
}: TokenSelectorModalProps) => {
  const { t } = useTranslation();
  const { network, swapRepository } = useSwapDependencies();

  const { register, control, setValue } = useForm({
    defaultValues: { tokenSearch: '' }
  });
  const query = useWatch({ control, name: 'tokenSearch' }) ?? '';

  const handleClose = () => {
    // Dismiss clears search (matrix row), regardless of which control closed it.
    setValue('tokenSearch', '');
    closeModal();
  };

  const { ref: clickAwayRef } = useClickAway({ callback: handleClose });

  const handleSelect = (token: IDexToken) => {
    onSelect(token);
    handleClose();
  };

  const contractPackageHash = parseContractHashQuery(query);

  const {
    token: hashToken,
    isLoading: isHashTokenLoading,
    isError: isHashTokenError,
    error: hashTokenError
  } = useFetchToken({
    network,
    swapRepository,
    contractPackageHash: contractPackageHash ?? ''
  });

  const renderBody = () => {
    if (contractPackageHash) {
      const status = getCustomTokenStatus({
        token: hashToken,
        isLoading: isHashTokenLoading,
        isError: isHashTokenError,
        status: hashTokenError?.status
      });

      switch (status) {
        case 'loading':
        case 'idle':
          return <Tile>{renderSkeletonRows(1)}</Tile>;
        case 'not-found':
          return (
            <Tile>
              <MessageContainer top={SpacingSize.Large}>
                <Typography type="body" color="contentSecondary">
                  <Trans t={t}>Token not found for this hash</Trans>
                </Typography>
              </MessageContainer>
            </Tile>
          );
        case 'error':
          return (
            <Tile>
              <MessageContainer top={SpacingSize.Large}>
                <Typography type="body" color="contentSecondary">
                  <Trans t={t}>Failed to fetch token</Trans>
                </Typography>
              </MessageContainer>
            </Tile>
          );
        case 'whitelisted':
        case 'unlisted': {
          // hashToken is defined whenever status is 'whitelisted' or 'unlisted'.
          const token = hashToken as IDexToken;

          return (
            <>
              <Tile>
                <TokenSelectorRow
                  token={token}
                  isSelected={token.id === selectedTokenId}
                  isUnlisted={status === 'unlisted'}
                  onSelect={() => handleSelect(token)}
                />
              </Tile>
              {status === 'unlisted' && (
                <WarningPanel>
                  <Typography type="captionRegular" color="contentPrimary">
                    <Trans t={t}>
                      CSPR.trade hasn't verified this token. Verify the contract
                      address and token details before trading. Proceed only if
                      you understand the risks.
                    </Trans>
                  </Typography>
                </WarningPanel>
              )}
            </>
          );
        }
      }
    }

    if (isLoading) {
      return <Tile>{renderSkeletonRows(SKELETON_ROW_COUNT)}</Tile>;
    }

    const filteredTokens = filterDexTokens(tokens ?? [], query);

    if (filteredTokens.length === 0) {
      return (
        <Tile>
          <MessageContainer top={SpacingSize.Large}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>No tokens found</Trans>
            </Typography>
          </MessageContainer>
        </Tile>
      );
    }

    return (
      <List
        rows={filteredTokens}
        height={LIST_HEIGHT}
        marginLeftForItemSeparatorLine={64}
        renderRow={token => (
          <TokenSelectorRow
            token={token}
            isSelected={token.id === selectedTokenId}
            onSelect={() => handleSelect(token)}
          />
        )}
      />
    );
  };

  return (
    <Overlay>
      <SheetContainer ref={clickAwayRef}>
        {/* ModalSwitcher translates the label itself; pass the raw key. */}
        <ModalSwitcher
          label="Choose token"
          closeSwitcher={handleClose}
          hideDoneButton
        >
          <InputsContainer>
            <Input
              prefixIcon={<SvgIcon src="assets/icons/search.svg" size={24} />}
              placeholder={t('Search')}
              disabled={isLoading}
              {...register('tokenSearch')}
            />
          </InputsContainer>

          <VerticalSpaceContainer top={SpacingSize.Medium}>
            {renderBody()}
          </VerticalSpaceContainer>
        </ModalSwitcher>
      </SheetContainer>
    </Overlay>
  );
};
