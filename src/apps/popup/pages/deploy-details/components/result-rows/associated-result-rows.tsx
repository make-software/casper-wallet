import React from 'react';

import { SimpleContainer } from '@popup/pages/deploy-details/components/common';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { Avatar, Hash, HashVariant } from '@libs/ui/components';

interface AssociatedResultRowsProps {
  publicKey: string;
}

export const AssociatedResultRows = ({
  publicKey
}: AssociatedResultRowsProps) => (
  <SimpleContainer entryPointName={'Updated account'}>
    <AlignedFlexRow gap={SpacingSize.Small}>
      <Avatar publicKey={publicKey} size={20} />
      <Hash
        value={publicKey}
        variant={HashVariant.CaptionHash}
        truncated
        truncatedSize="small"
        color="contentAction"
      />
    </AlignedFlexRow>
  </SimpleContainer>
);
