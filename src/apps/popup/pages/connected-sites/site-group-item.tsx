import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';
import styled from 'styled-components';

import {
  AlignedSpaceBetweenFlexRow,
  LeftAlignedFlexColumn
} from '@libs/layout';
import { HardwareWalletType } from '@libs/types/account';
import { Hash, HashVariant, SvgIcon, Typography } from '@libs/ui/components';

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
  hardware?: HardwareWalletType;
  csprName: Maybe<string> | undefined;
}

export function SiteGroupItem({
  name,
  publicKey,
  handleOnClick,
  imported,
  hardware,
  csprName
}: SiteGroupItemProps) {
  return (
    <SiteGroupItemContainer>
      <AccountNameAndPublicKeyContainer>
        <Typography type="body" dataTestId="account-name">
          {name}
        </Typography>
        <Hash
          variant={HashVariant.CaptionHash}
          csprName={csprName}
          value={publicKey}
          truncated
          isImported={imported}
          isLedger={hardware === HardwareWalletType.Ledger}
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
