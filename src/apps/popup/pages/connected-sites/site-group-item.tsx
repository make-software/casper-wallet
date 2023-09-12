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
  imported?: boolean;
}

export function SiteGroupItem({
  name,
  publicKey,
  handleOnClick,
  imported
}: SiteGroupItemProps) {
  return (
    <SiteGroupItemContainer>
      <AccountNameAndPublicKeyContainer>
        <Typography type="body" dataTestId="account-name">
          {name}
        </Typography>
        <Hash
          variant={HashVariant.CaptionHash}
          value={publicKey}
          truncated
          withTag={imported}
          placement="bottomRight"
        />
      </AccountNameAndPublicKeyContainer>
      <SvgIcon
        dataTestId="disconnect-account-icon"
        onClick={handleOnClick}
        src="assets/icons/close.svg"
      />
    </SiteGroupItemContainer>
  );
}
