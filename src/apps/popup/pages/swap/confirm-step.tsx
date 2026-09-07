import { TOKEN_DISPLAY_DECIMALS } from 'casper-wallet-core/src/domain/constants/config';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  ContentContainer,
  FlexColumn,
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { List, Spinner, SvgIcon, Typography } from '@libs/ui/components';

import { formatAmountForDisplay } from './amount-input-utils';
import { DexTokenIcon } from './components/dex-token-icon';
import { ISwapReviewData } from './types';
import {
  ISwapAmountRow,
  ISwapProgressRow,
  buildSwapAmountRows,
  buildSwapDetailRows
} from './utils';
import { getReviewMode, swapModeLabels } from './wrap-utils';

const AmountRowContainer = styled(FlexColumn)`
  padding: 12px 16px;
`;

const ListItemContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px;
`;

const TokenIcon = ({ row }: { row: ISwapAmountRow }) => (
  <DexTokenIcon icon={row.icon} symbol={row.symbol} />
);

/** The right-hand mark of a progress row: spinning while it runs, then a check or an error mark. */
const ProgressStatusIndicator = ({
  status
}: {
  status: ISwapProgressRow['status'];
}) => {
  switch (status) {
    case 'pending':
    case 'awaiting':
      return <Spinner style={{ marginTop: 0 }} />;
    case 'success':
      return (
        <SvgIcon
          src="assets/icons/tick-in-circle.svg"
          color="contentPositive"
          size={16}
        />
      );
    case 'error':
      return (
        <SvgIcon
          src="assets/icons/error.svg"
          color="contentActionCritical"
          size={16}
        />
      );
    default:
      return null;
  }
};

interface ConfirmStepProps {
  review: ISwapReviewData;
  /** The running flow's legs. Empty until a submission starts — see Task 5. */
  progressRows: ISwapProgressRow[];
}

export const ConfirmStep = ({ review, progressRows }: ConfirmStepProps) => {
  const { t } = useTranslation();

  const amountRows = buildSwapAmountRows(review, t);
  const detailRows = buildSwapDetailRows(review, t);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>
            {swapModeLabels[getReviewMode(review)].confirmTitle}
          </Trans>
        </Typography>
      </ParagraphContainer>

      <List
        rows={amountRows}
        renderRow={row => (
          <AmountRowContainer key={row.id} gap={SpacingSize.Tiny}>
            <Typography type="body" color="contentSecondary">
              {row.label}
            </Typography>
            <AlignedFlexRow gap={SpacingSize.Small}>
              <TokenIcon row={row} />
              <FlexColumn>
                <Typography type="bodyHash">
                  {formatAmountForDisplay(row.amount, TOKEN_DISPLAY_DECIMALS)}{' '}
                  {row.symbol}
                </Typography>
                {row.fiat != null && (
                  <Typography type="captionMedium" color="contentSecondary">
                    {row.fiat}
                  </Typography>
                )}
              </FlexColumn>
            </AlignedFlexRow>
          </AmountRowContainer>
        )}
        marginLeftForItemSeparatorLine={8}
      />

      {progressRows.length === 0 ? (
        detailRows.length > 0 && (
          <List
            rows={detailRows}
            renderRow={row => (
              <ListItemContainer key={row.id}>
                <Typography type="body" color="contentSecondary">
                  {row.text}
                </Typography>
                <Typography type="captionHash">{row.value}</Typography>
              </ListItemContainer>
            )}
            marginLeftForItemSeparatorLine={8}
          />
        )
      ) : (
        <List
          rows={progressRows}
          renderRow={row => (
            <ListItemContainer key={row.id}>
              <FlexColumn>
                <Typography type="body" color="contentSecondary">
                  {row.text}
                </Typography>
                {row.hint != null && (
                  <Typography type="captionRegular" color="contentSecondary">
                    {row.hint}
                  </Typography>
                )}
              </FlexColumn>
              <ProgressStatusIndicator status={row.status} />
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={8}
        />
      )}
    </ContentContainer>
  );
};
