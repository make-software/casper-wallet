import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { NetworkSetting } from '@src/constants';

import { activeNetworkSettingChanged } from '@background/redux/settings/actions';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { AlignedFlexRow, SpaceBetweenFlexRow, SpacingSize } from '@libs/layout';
import { HeaderBackgroundContainer } from '@libs/layout/header/components/header-background-container';
import { Modal, SvgIcon, Typography } from '@libs/ui/components';
import { Color } from '@libs/ui/utils';

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

const NetworkIconColor: Record<NetworkSetting, Color> = {
  Mainnet: 'contentLightRed',
  Testnet: 'contentLightBlue',
  Devnet: 'contentWarning',
  Integration: 'contentPositive'
};

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

  const changeActiveNetworkToDevnet = () => {
    if (activeNetwork === NetworkSetting.Devnet) {
      return;
    }

    dispatchToMainStore(activeNetworkSettingChanged(NetworkSetting.Devnet));
  };

  const changeActiveNetworkToIntegration = () => {
    if (activeNetwork === NetworkSetting.Integration) {
      return;
    }

    dispatchToMainStore(
      activeNetworkSettingChanged(NetworkSetting.Integration)
    );
  };

  return (
    <Modal
      placement="top"
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
                color="contentActionCritical"
              />
              <Typography type="body">{NetworkSetting.Mainnet}</Typography>
            </AlignedFlexRow>
            {activeNetwork === NetworkSetting.Mainnet && (
              <SvgIcon
                src="assets/icons/tick.svg"
                size={24}
                color="contentAction"
              />
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
                color="contentAction"
              />
              <Typography type="body">{NetworkSetting.Testnet}</Typography>
            </AlignedFlexRow>
            {activeNetwork === NetworkSetting.Testnet && (
              <SvgIcon
                src="assets/icons/tick.svg"
                size={24}
                color="contentAction"
              />
            )}
          </ModalContentRow>
          <ModalContentRow
            onClick={event => {
              changeActiveNetworkToDevnet();
              closeModal(event);
            }}
          >
            <AlignedFlexRow gap={SpacingSize.Large}>
              <SvgIcon
                src="assets/icons/network.svg"
                size={24}
                color="contentWarning"
              />
              <Typography type="body">{NetworkSetting.Devnet}</Typography>
            </AlignedFlexRow>
            {activeNetwork === NetworkSetting.Devnet && (
              <SvgIcon
                src="assets/icons/tick.svg"
                size={24}
                color="contentAction"
              />
            )}
          </ModalContentRow>
          <ModalContentRow
            onClick={event => {
              changeActiveNetworkToIntegration();
              closeModal(event);
            }}
          >
            <AlignedFlexRow gap={SpacingSize.Large}>
              <SvgIcon
                src="assets/icons/network.svg"
                size={24}
                color="contentPositive"
              />
              <Typography type="body">{NetworkSetting.Integration}</Typography>
            </AlignedFlexRow>
            {activeNetwork === NetworkSetting.Integration && (
              <SvgIcon
                src="assets/icons/tick.svg"
                size={24}
                color="contentAction"
              />
            )}
          </ModalContentRow>
        </ModalContentContainer>
      )}
      children={({ isOpen }) => (
        <HeaderBackgroundContainer isOpen={isOpen}>
          <SvgIcon
            src="assets/icons/network.svg"
            size={24}
            dataTestId="network-switcher"
            color={NetworkIconColor[activeNetwork]}
          />
        </HeaderBackgroundContainer>
      )}
    />
  );
};
