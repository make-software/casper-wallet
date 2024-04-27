import { Player } from '@lottiefiles/react-lottie-player';
import debounce from 'lodash.debounce';
import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEqualCaseInsensitive } from '@src/utils';

import { selectVaultLedgerAccounts } from '@background/redux/vault/selectors';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import dotsDarkModeAnimation from '@libs/animations/dots_dark_mode.json';
import dotsLightModeAnimation from '@libs/animations/dots_light_mode.json';
import {
  CenteredFlexRow,
  FlexColumn,
  LeftAlignedCenteredFlexRow,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import {
  Avatar,
  Checkbox,
  Hash,
  HashVariant,
  Input,
  List,
  Tooltip,
  Typography
} from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useImportLedgerAccountsForm } from '@libs/ui/forms/import-ledger-account';
import { formatNumber, motesToCSPR } from '@libs/ui/utils';

import { ILedgerAccountListItem } from './types';

const ListItemContainer = styled(FlexColumn)<{ disabled?: boolean }>`
  padding: 20px 16px;

  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;
const FooterContainer = styled(LeftAlignedCenteredFlexRow)`
  padding: 18px 16px;
`;
const MoreItem = styled(Typography)`
  cursor: pointer;
`;
const AmountContainer = styled(FlexColumn)`
  max-width: 90px;
`;

interface ListProps {
  ledgerAccountsWithBalance: ILedgerAccountListItem[];
  setIsButtonDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedAccounts: ILedgerAccountListItem[];
  setSelectedAccounts: React.Dispatch<
    React.SetStateAction<ILedgerAccountListItem[]>
  >;
  maxItemsToRender: number;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export const LedgerAccountsList = ({
  ledgerAccountsWithBalance,
  setIsButtonDisabled,
  selectedAccounts,
  setSelectedAccounts,
  maxItemsToRender,
  onLoadMore,
  isLoadingMore
}: ListProps) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  const alreadyConnectedLedgerAccounts = useSelector(selectVaultLedgerAccounts);

  const {
    control,
    getValues,
    formState: { isValid }
  } = useImportLedgerAccountsForm(ledgerAccountsWithBalance);
  // TODO https://react-hook-form.com/docs/usefieldarray because of issues with new fields addition

  const handleInputChange = (id: string, newValue: string) => {
    // Update the state with the new value
    setSelectedAccounts(prevItems =>
      prevItems.map(item =>
        isEqualCaseInsensitive(item.id, id)
          ? { ...item, name: newValue.trim() }
          : item
      )
    );
  };

  const debounceInputChange = debounce(handleInputChange, 1000);

  useEffect(() => {
    const isButtonDisabled = calculateSubmitButtonDisabled({
      isValid
    });

    setIsButtonDisabled(!!isButtonDisabled);
  }, [isValid, setIsButtonDisabled]);

  return (
    <List<ILedgerAccountListItem>
      rows={ledgerAccountsWithBalance}
      contentTop={SpacingSize.XL}
      maxItemsToRender={maxItemsToRender}
      renderRow={(account, index) => {
        const inputFieldName = `name-${index}`;
        const checkBoxFieldName = `name-${index} + Check`;
        const balance = formatNumber(
          motesToCSPR(String(account.balance.liquidMotes)),
          {
            precision: { max: 0 }
          }
        );

        const isAlreadyConnected = alreadyConnectedLedgerAccounts.find(
          alreadyConnectedAccount =>
            isEqualCaseInsensitive(
              alreadyConnectedAccount.publicKey,
              account.publicKey
            )
        );

        return (
          <ListItemContainer
            gap={SpacingSize.Medium}
            disabled={!!isAlreadyConnected}
            title={
              isAlreadyConnected
                ? 'This account already connected to the wallet'
                : undefined
            }
          >
            <Controller
              control={control}
              //@ts-ignore
              defaultValue={isAlreadyConnected ? true : undefined}
              render={({ field }) => (
                <SpaceBetweenFlexRow
                  onClick={() => {
                    if (isAlreadyConnected) return;

                    const accountIndex = selectedAccounts.findIndex(
                      alreadySelectedAccount =>
                        isEqualCaseInsensitive(
                          alreadySelectedAccount.id,
                          account.id
                        )
                    );
                    const accountName: string = getValues(inputFieldName);

                    let updatedAccounts;
                    if (accountIndex !== -1) {
                      // Account exists, remove from list:
                      updatedAccounts = selectedAccounts.filter(
                        alreadySelectedAccount =>
                          alreadySelectedAccount.id !== account.id
                      );
                    } else {
                      // Account doesn't exist, add to list:
                      updatedAccounts = selectedAccounts.concat({
                        ...account,
                        name: accountName
                      });
                    }

                    setSelectedAccounts(updatedAccounts);
                    field.onChange(!field.value);
                  }}
                >
                  <CenteredFlexRow gap={SpacingSize.Medium}>
                    <Avatar publicKey={account.publicKey} size={32} />
                    <Hash
                      value={account.publicKey}
                      variant={HashVariant.CaptionHash}
                      truncated
                      withoutTooltip
                      color="contentPrimary"
                    />
                  </CenteredFlexRow>
                  <CenteredFlexRow gap={SpacingSize.Medium}>
                    <AmountContainer>
                      <Tooltip
                        title={balance.length > 9 ? balance : undefined}
                        placement="topLeft"
                        overflowWrap
                        fullWidth
                      >
                        <Typography
                          type="bodyHash"
                          style={{ textAlign: 'right' }}
                          ellipsis
                        >
                          {balance}
                        </Typography>
                      </Tooltip>
                      <Typography
                        type="captionHash"
                        color="contentSecondary"
                        style={{ textAlign: 'right' }}
                      >
                        CSPR
                      </Typography>
                    </AmountContainer>
                    <Checkbox
                      checked={!!(isAlreadyConnected || field.value)}
                      variant="square"
                      disabled={!!isAlreadyConnected}
                    />
                  </CenteredFlexRow>
                </SpaceBetweenFlexRow>
              )}
              name={checkBoxFieldName}
            />
            {(getValues(checkBoxFieldName) || isAlreadyConnected) && (
              <Controller
                control={control}
                render={({
                  field: { value, onChange },
                  formState: { errors }
                }) => (
                  <Input
                    secondaryBackground
                    disabled={Boolean(isAlreadyConnected)}
                    style={{
                      paddingLeft: '44px'
                    }}
                    value={value}
                    onChange={event => {
                      onChange(event);
                      debounceInputChange(account.id, event.target.value);
                    }}
                    error={!!errors[inputFieldName]}
                    validationText={errors[inputFieldName]?.message}
                  />
                )}
                name={inputFieldName}
              />
            )}
          </ListItemContainer>
        );
      }}
      marginLeftForItemSeparatorLine={56}
      renderFooter={() =>
        isLoadingMore ? (
          <Player
            renderer="svg"
            autoplay
            loop
            src={isDarkMode ? dotsDarkModeAnimation : dotsLightModeAnimation}
            style={{ height: '80px' }}
          />
        ) : (
          <FooterContainer>
            <MoreItem
              type="captionRegular"
              color="contentAction"
              onClick={onLoadMore}
            >
              <Trans t={t}>Show next 5 accounts</Trans>
            </MoreItem>
          </FooterContainer>
        )
      }
    />
  );
};
