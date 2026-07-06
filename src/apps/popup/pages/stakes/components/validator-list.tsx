import { useVirtualizer } from '@tanstack/react-virtual';
import { ValidatorDto } from 'casper-wallet-core/src/data/dto/validators';
import React, { useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  DropdownHeader,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Tile, Typography, ValidatorPlate } from '@libs/ui/components';

import {
  ROW_HEIGHT_PX,
  getValidatorListHeight
} from './get-validator-list-height';

interface ValidatorListProps {
  filteredValidatorsList: ValidatorDto[];
  handleValidatorClick: (validator: ValidatorDto) => void;
  totalStake: 'formattedTotalStake' | 'formattedDecimalStake';
}

const Container = styled.div``;

const ScrollContainer = styled.div<{ maxHeight: number }>`
  max-height: ${({ maxHeight }) => maxHeight}px;
  overflow-y: auto;
`;

export const ValidatorList = ({
  filteredValidatorsList,
  handleValidatorClick,
  totalStake
}: ValidatorListProps) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredValidatorsList.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 5
  });

  return (
    <VerticalSpaceContainer top={SpacingSize.Tiny}>
      <Tile borderRadius="base">
        <DropdownHeader>
          <Typography type="labelMedium" color="contentSecondary">
            <Trans t={t}>Validator</Trans>
          </Typography>
          <Typography type="labelMedium" color="contentSecondary">
            <Trans t={t}>Total stake, fee, delegators</Trans>
          </Typography>
        </DropdownHeader>
        <ScrollContainer
          ref={scrollContainerRef}
          maxHeight={getValidatorListHeight(filteredValidatorsList.length)}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative'
            }}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const validator = filteredValidatorsList[virtualRow.index];
              const logo = validator?.svgLogo || validator?.imgLogo;

              return (
                <Container
                  key={validator.publicKey}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <ValidatorPlate
                    minAmount={validator.minAmount}
                    reservedSlots={validator.reservedSlots}
                    publicKey={validator?.publicKey}
                    fee={validator.fee}
                    name={validator?.name}
                    logo={logo}
                    // TODO: remove user_stake after we merge recipient and amount steps for undelegation
                    formattedTotalStake={validator[totalStake]}
                    delegatorsNumber={validator?.delegatorsNumber}
                    handleClick={() => {
                      handleValidatorClick(validator);
                    }}
                    withBorder
                  />
                </Container>
              );
            })}
          </div>
        </ScrollContainer>
      </Tile>
    </VerticalSpaceContainer>
  );
};
