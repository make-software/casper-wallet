import { ValidatorDto } from 'casper-wallet-core/src/data/dto/validators';
import React from 'react';
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
          maxHeight={getValidatorListHeight(filteredValidatorsList.length)}
        >
          {filteredValidatorsList.map(validator => {
            const logo = validator?.svgLogo || validator?.imgLogo;

            return (
              <Container
                key={validator.publicKey}
                style={{ height: ROW_HEIGHT_PX }}
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
        </ScrollContainer>
      </Tile>
    </VerticalSpaceContainer>
  );
};
