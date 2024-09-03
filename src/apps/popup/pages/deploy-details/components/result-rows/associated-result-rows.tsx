import React from 'react';

import { SimpleContainer } from '@popup/pages/deploy-details/components/common';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';

interface AssociatedResultRowsProps {
  publicKey: string;
}

export const AssociatedResultRows = ({
  publicKey
}: AssociatedResultRowsProps) => (
  <SimpleContainer title={'Updated account'}>
    <AlignedFlexRow gap={SpacingSize.Small}>
      <AccountInfoRow publicKey={publicKey} isAction iconSize={20} />
    </AlignedFlexRow>
  </SimpleContainer>
);
