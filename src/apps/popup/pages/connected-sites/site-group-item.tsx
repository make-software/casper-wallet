import React from 'react';
import styled from 'styled-components';

import { Hash, HashVariant, SvgIcon, Typography } from '@libs/ui';

const CentredFlexRow = styled.div`
  display: flex;
  width: 100%;

  align-items: center;

  gap: 18px;
`;

const SiteGroupItemContainer = styled(CentredFlexRow)`
  display: flex;
  justify-content: space-between;

  padding: 12px 16px;
`;

const AccountNameAndPublicKeyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

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
      <SvgIcon onClick={handleOnClick} src="assets/icons/close.svg" size={24} />
    </SiteGroupItemContainer>
  );
}
