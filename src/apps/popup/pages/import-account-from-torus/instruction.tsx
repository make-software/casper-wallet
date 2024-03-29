import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  ContentContainer,
  IllustrationContainer,
  LeftAlignedFlexColumn,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { List, SvgIcon, Typography } from '@libs/ui/components';

const ItemContainer = styled(AlignedFlexRow)<{ withDescription: boolean }>`
  padding: ${({ withDescription }) => (withDescription ? '8px 16px' : '16px')};
`;

const list = [
  {
    id: 1,
    header: 'Open Settings in Torus Wallet'
  },
  {
    id: 2,
    header: 'Click ‘Account Details’',
    description: 'In ‘Privacy and Security’ section'
  },
  {
    id: 3,
    header: 'Click ‘Show your private key’'
  },
  {
    id: 4,
    header: 'Click ‘Account Details’',
    description: 'You’ll need to paste it on the next screen'
  }
];

export const Instruction = () => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/import-account-from-torus.svg"
          width={296}
          height={120}
        />
      </IllustrationContainer>

      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Import account from Torus Wallet</Trans>
        </Typography>
      </ParagraphContainer>

      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Please note, that accounts imported with a secret key cannot be
            recovered using your Casper Wallet secret recovery phrase.
          </Trans>
        </Typography>
      </ParagraphContainer>

      <List
        rows={list}
        renderRow={({ header, description }) => (
          <ItemContainer
            gap={SpacingSize.Large}
            withDescription={!!description}
          >
            <SvgIcon src="assets/icons/radio-button-on.svg" size={24} />
            <LeftAlignedFlexColumn>
              <Typography type="body">{header}</Typography>
              {description && (
                <Typography type="listSubtext" color="contentSecondary">
                  {description}
                </Typography>
              )}
            </LeftAlignedFlexColumn>
          </ItemContainer>
        )}
        marginLeftForItemSeparatorLine={54}
      />
    </ContentContainer>
  );
};
