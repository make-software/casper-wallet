import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { AlignedFlexRow, SpaceBetweenFlexRow, SpacingSize } from '@libs/layout';
import { SvgIcon, Typography, Modal } from '@libs/ui';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { activeNetworkSettingChanged } from '@background/redux/settings/actions';
import { NetworkSetting } from '@src/constants';

const NetworkSwitcherContainer = styled(AlignedFlexRow)`
  background-color: rgb(0, 0, 0, 0.16);
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;

const ModalContentContainer = styled.div`
  padding: 8px;
`;

const ModalContentRow = styled(SpaceBetweenFlexRow)`
  cursor: pointer;
  padding: 8px;

  &:hover {
    background-color: ${({ theme }) => theme.color.backgroundSecondary};
    border-radius: ${({ theme }) => theme.borderRadius.base}px;
  }
`;

export const HeaderNetworkSwitcher = () => {
  const activeNetwork = useSelector(selectActiveNetworkSetting);

  const changeActiveNetworkToMainnet = () => {
    if (activeNetwork === NetworkSetting.Mainnet) {
      return;
    }

    dispatchToMainStore(activeNetworkSettingChanged(NetworkSetting.Mainnet));
  };
  const changeActiveNetworkToTestnet = () => {
    if (activeNetwork === NetworkSetting.Testnet) {
      return;
    }

    dispatchToMainStore(activeNetworkSettingChanged(NetworkSetting.Testnet));
  };

  return (
    <Modal
      renderContent={({ closeModal }) => (
        <ModalContentContainer>
          <ModalContentRow
            onClick={event => {
              changeActiveNetworkToMainnet();
              closeModal(event);
            }}
          >
            <AlignedFlexRow gap={SpacingSize.Large}>
              <SvgIcon
                src="assets/icons/network.svg"
                size={24}
                color="contentRed"
              />
              <Typography type="body">{NetworkSetting.Mainnet}</Typography>
            </AlignedFlexRow>
            {activeNetwork === NetworkSetting.Mainnet && (
              <SvgIcon src="assets/icons/tick.svg" size={24} />
            )}
          </ModalContentRow>
          <ModalContentRow
            onClick={event => {
              changeActiveNetworkToTestnet();
              closeModal(event);
            }}
          >
            <AlignedFlexRow gap={SpacingSize.Large}>
              <SvgIcon
                src="assets/icons/network.svg"
                size={24}
                color="contentBlue"
              />
              <Typography type="body">{NetworkSetting.Testnet}</Typography>
            </AlignedFlexRow>
            {activeNetwork === NetworkSetting.Testnet && (
              <SvgIcon src="assets/icons/tick.svg" size={24} />
            )}
          </ModalContentRow>
        </ModalContentContainer>
      )}
      children={({ isOpen }) => (
        <NetworkSwitcherContainer gap={SpacingSize.Tiny}>
          <SvgIcon
            src="assets/icons/network.svg"
            size={16}
            color="contentOnFill"
          />
          <Typography type="listSubtext" color="contentOnFill">
            {activeNetwork}
          </Typography>
          <SvgIcon
            size={16}
            src="assets/icons/chevron-up.svg"
            flipByAxis={isOpen ? undefined : 'X'}
            color="contentOnFill"
          />
        </NetworkSwitcherContainer>
      )}
    />
  );
};
