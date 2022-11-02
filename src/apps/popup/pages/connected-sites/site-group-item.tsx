import React from 'react';
import styled from 'styled-components';

import { Hash, HashVariant, SvgIcon, Typography } from '@src/libs/ui';
import {
  AlignedSpaceBetweenFlexRow,
  LeftAlignedFlexColumn
} from '@src/libs/layout';

const SiteGroupItemContainer = styled(AlignedSpaceBetweenFlexRow)`
  gap: 18px;

  width: 100%;
  padding: 12px 16px;
`;

const AccountNameAndPublicKeyContainer = styled(LeftAlignedFlexColumn)``;

interface SiteGroupItemProps {
  name: string;
  publicKey: string;
  handleOnClick: () => void;
}

export function SiteGroupItem({
  name,
  publicKey,
  handleOnClick
}: SiteGroupItemProps) {
  return (
    <SiteGroupItemContainer>
      <AccountNameAndPublicKeyContainer>
        <Typography type="body">{name}</Typography>
        <Hash variant={HashVariant.CaptionHash} value={publicKey} truncated />
      </AccountNameAndPublicKeyContainer>
      <SvgIcon onClick={handleOnClick} src="assets/icons/close.svg" />
    </SiteGroupItemContainer>
  );
}
