import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import { useFetchToken } from 'casper-wallet-core/src/react';
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useClickAway } from '@hooks/use-click-away';

import {
  AlignedFlexRow,
  FlexColumn,
  FooterButtonsContainer,
  InputsContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { useSwapDependencies } from '@libs/services/swap-service';
import {
  Button,
  Input,
  List,
  Skeleton,
  SvgIcon,
  Tile,
  Typography
} from '@libs/ui/components';
import { hexToRGBA } from '@libs/ui/utils/hex-to-rgba';

import {
  filterDexTokens,
  getCustomTokenStatus,
  parseContractHashQuery
} from '../token-selector-utils';
import { TokenSelectorRow } from './token-selector-row';

const SKELETON_ROW_COUNT = 5;

// The sheet chrome is local rather than `Modal` + `ModalSwitcher`: `ModalSwitcher` gives Cancel
// and Done the same callback, so a draft selection cannot tell them apart (D10), and `Modal` owns
// its open state behind a trigger this component does not have. `@libs/layout`'s Overlay is
// likewise unusable — `height: 100vh` plus `margin-top: 72px` ends its box 72px past the popup's
// fold, putting anything docked to its bottom off-screen.
const SheetOverlay = styled.div`
  position: fixed;
  z-index: ${({ theme }) => theme.zIndex.modal};
  top: 72px;
  bottom: 0;
  left: 50%;
  width: 360px;

  transform: translateX(-50%);

  background: ${({ theme }) => hexToRGBA(theme.color.black, '0.32')};
`;

const SheetContainer = styled(FlexColumn)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0;
  max-width: 360px;

  height: 528px;

  background-color: ${({ theme }) => theme.color.backgroundSecondary};
  border-top-left-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  border-top-right-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  box-shadow: ${({ theme }) => theme.shadow.contextMenu};
`;

const HeaderContainer = styled(AlignedFlexRow)`
  padding: 16px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-top-right-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
  border-top-left-radius: ${({ theme }) => theme.borderRadius.sixteen}px;
`;

const SheetContentContainer = styled.div`
  padding: 0 16px;

  flex-grow: 1;
  overflow-y: auto;
`;

const CancelLabel = styled(Typography)`
  cursor: pointer;
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

  // Seeded once on mount: this component is only ever rendered while the
  // sheet is open, so "when the sheet opens" (D10) is "on mount" here.
  const [draftToken, setDraftToken] = useState<IDexToken | null>(
    () => tokens?.find(token => token.id === selectedTokenId) ?? null
  );

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

  const handleDone = () => {
    if (draftToken) {
      onSelect(draftToken);
    }
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
                  isSelected={draftToken?.id === token.id}
                  isUnlisted={status === 'unlisted'}
                  onSelect={() => setDraftToken(token)}
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
        height={280}
        marginLeftForItemSeparatorLine={64}
        renderRow={token => (
          <TokenSelectorRow
            token={token}
            isSelected={draftToken?.id === token.id}
            onSelect={() => setDraftToken(token)}
          />
        )}
      />
    );
  };

  return (
    <SheetOverlay>
      <SheetContainer ref={clickAwayRef}>
        <HeaderContainer>
          <CancelLabel
            type="bodySemiBold"
            color="contentAction"
            onClick={handleClose}
          >
            <Trans t={t}>Cancel</Trans>
          </CancelLabel>
        </HeaderContainer>

        <SheetContentContainer>
          <ParagraphContainer top={SpacingSize.XL}>
            <Typography type="header">
              <Trans t={t}>Choose token</Trans>
            </Typography>
          </ParagraphContainer>

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
        </SheetContentContainer>

        <FooterButtonsContainer>
          <Button onClick={handleDone}>
            <Trans t={t}>Done</Trans>
          </Button>
        </FooterButtonsContainer>
      </SheetContainer>
    </SheetOverlay>
  );
};
