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
import { ValidatorResultWithId } from '@libs/services/validators-service';
import { Tile, Typography, ValidatorPlate } from '@libs/ui/components';

interface ValidatorListProps {
  filteredValidatorsList: ValidatorResultWithId[];
  handleValidatorClick: (validator: ValidatorResultWithId) => void;
  totalStake: 'total_stake' | 'user_stake';
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
              rowHeight={64}
              height={Math.min(3 * 64, filteredValidatorsList.length * 64)}
              width={width}
              rowCount={filteredValidatorsList.length}
              rowRenderer={({ index, key, style }) => {
                const validator = filteredValidatorsList[index];
                const logo =
                  validator?.account_info?.info?.owner?.branding?.logo?.svg ||
                  validator?.account_info?.info?.owner?.branding?.logo
                    ?.png_256 ||
                  validator?.account_info?.info?.owner?.branding?.logo
                    ?.png_1024;

                return (
                  <Container style={style}>
                    <ValidatorPlate
                      key={key}
                      publicKey={validator?.public_key}
                      fee={validator.fee}
                      name={validator?.account_info?.info?.owner?.name}
                      logo={logo}
                      // TODO: remove user_stake after we merge recipient and amount steps for undelegation
                      totalStake={validator[totalStake]}
                      delegatorsNumber={validator?.delegators_number}
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
