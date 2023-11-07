import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Button, Modal, SvgIcon, Typography } from '@libs/ui';
import { CenteredFlexColumn, SpacingSize } from '@libs/layout';

import { ModalButtons } from './modal-buttons';

const MoreButton = styled(CenteredFlexColumn)`
  cursor: pointer;

  padding: 0 16px;
`;

interface MoreButtonsModalProps {
  handleBuyWithCSPR: () => void;
}

export const MoreButtonsModal = ({
  handleBuyWithCSPR
}: MoreButtonsModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal
      placement="bottom"
      renderContent={() => (
        <ModalButtons handleBuyWithCSPR={handleBuyWithCSPR} />
      )}
      children={() => (
        <MoreButton gap={SpacingSize.Small}>
          <Button circle>
            <SvgIcon
              src="assets/icons/more.svg"
              color="contentOnFill"
              style={{
                transform: 'rotate(90deg)'
              }}
            />
          </Button>
          <Typography type="captionMedium" color="contentAction">
            <Trans t={t}>More</Trans>
          </Typography>
        </MoreButton>
      )}
    />
  );
};
