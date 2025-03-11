import { ValidatorDto } from 'casper-wallet-core/src/data/dto/validators';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import List from 'react-virtualized/dist/commonjs/List';
import styled from 'styled-components';

import {
  DropdownHeader,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Tile, Typography, ValidatorPlate } from '@libs/ui/components';

interface ValidatorListProps {
  filteredValidatorsList: ValidatorDto[];
  handleValidatorClick: (validator: ValidatorDto) => void;
  totalStake: 'formattedTotalStake' | 'formattedDecimalStake';
}

const Container = styled.div``;

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
        <AutoSizer disableHeight>
          {({ width }) => (
            <List
              overscanRowCount={5}
              rowHeight={80}
              height={Math.min(3 * 80, filteredValidatorsList.length * 80)}
              width={width}
              rowCount={filteredValidatorsList.length}
              rowRenderer={({ index, key, style }) => {
                const validator = filteredValidatorsList[index];
                const logo = validator?.svgLogo || validator?.imgLogo;

                return (
                  <Container style={style} key={key}>
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
              }}
            />
          )}
        </AutoSizer>
      </Tile>
    </VerticalSpaceContainer>
  );
};
