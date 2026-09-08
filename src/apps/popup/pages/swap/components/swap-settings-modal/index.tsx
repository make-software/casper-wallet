import React from 'react';
import { useTranslation } from 'react-i18next';

import { SpacingSize, VerticalSpaceContainer } from '@libs/layout';
import { Input, Modal, ModalSwitcher } from '@libs/ui/components';

import { useSwapSettingsForm } from './use-swap-settings-form';

interface SwapSettingsModalProps {
  children: (renderProps: { isOpen: boolean }) => React.ReactNode;
}

export const SwapSettingsModal = ({ children }: SwapSettingsModalProps) => (
  <Modal
    placement="fullBottom"
    dataTestId="swap-settings-modal"
    renderContent={({ closeModal }) => (
      <SwapSettingsModalContent closeModal={closeModal} />
    )}
  >
    {children}
  </Modal>
);

const SwapSettingsModalContent = ({
  closeModal
}: {
  closeModal: (e: React.MouseEvent<Element, MouseEvent>) => void;
}) => {
  const { t } = useTranslation();
  const {
    slippageInput,
    deadlineInput,
    showHighSlippageWarning,
    handleSlippageChange,
    handleDeadlineChange,
    commit
  } = useSwapSettingsForm();

  return (
    <ModalSwitcher
      // ModalSwitcher translates the label itself; pass the raw key.
      label="Swap settings"
      closeSwitcher={closeModal}
      onDone={event => {
        commit();
        closeModal(event);
      }}
    >
      <VerticalSpaceContainer top={SpacingSize.XL}>
        <Input
          label={t('Max Slippage')}
          type="text"
          value={slippageInput}
          onChange={handleSlippageChange}
          suffixText="%"
          warning={showHighSlippageWarning}
          validationText={
            showHighSlippageWarning ? t('Too high slippage') : null
          }
          dataTestId="swap-settings-slippage"
        />
      </VerticalSpaceContainer>

      <VerticalSpaceContainer top={SpacingSize.XL}>
        <Input
          label={t('Swap Deadline')}
          type="text"
          value={deadlineInput}
          onChange={handleDeadlineChange}
          suffixText={t('minutes')}
          dataTestId="swap-settings-deadline"
        />
      </VerticalSpaceContainer>
    </ModalSwitcher>
  );
};
