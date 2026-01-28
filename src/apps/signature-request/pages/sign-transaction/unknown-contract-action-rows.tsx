import {
  ITxSignatureRequestArg,
  ITxSignatureRequestUnknownContractAction,
  ITxSignatureRequestWasmAction,
  ITxSignatureRequestWasmProxyAction,
  formatTokenBalance,
  isTxSignatureRequestUnknownContractAction,
  isTxSignatureRequestWasmProxyAction
} from 'casper-wallet-core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

import { DeployIcon } from '@src/constants';

import { SimpleContainer } from '@popup/pages/deploy-details/components/common';

import {
  AlignedFlexRow,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { Hash, HashVariant, SvgIcon, Typography } from '@libs/ui/components';
import { AccountInfoIcon } from '@libs/ui/components/account-info-icon/account-info-icon';
import { AccountInfoRow } from '@libs/ui/components/account-info-row/account-info-row';
import { MaybeLink } from '@libs/ui/components/maybe-link/maybe-link';
import { PortalTooltip } from '@libs/ui/components/portal-tooltip/portal-tooltip';
import { formatDate } from '@libs/ui/utils';

const AlignedFlexRowContainer = styled(AlignedFlexRow)`
  column-gap: 8px;
  flex-wrap: nowrap;
`;

interface UnknownContractActionRowsProps {
  title: string;
  action:
    | ITxSignatureRequestUnknownContractAction
    | ITxSignatureRequestWasmProxyAction
    | ITxSignatureRequestWasmAction;
}

const collapsedHeight = 116;

export const UnknownContractActionRows = ({
  title,
  action
}: UnknownContractActionRowsProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const renderArg = useCallback(
    (
      [key, value]: [string, ITxSignatureRequestArg],
      level: number
    ): JSX.Element | null => {
      const renderValue = () => {
        switch (value.type) {
          case 'accountLink':
          case 'uref':
          case 'hash':
          case 'number':
          case 'timestamp':
          case 'string':
            return (
              <AlignedFlexRowContainer gap={SpacingSize.Small}>
                {value.type === 'number' && (
                  <>
                    {Boolean(key) && (
                      <Typography type="captionRegular" color="contentPrimary">
                        <Trans t={t}>{key.toString()}</Trans>
                      </Typography>
                    )}
                    <Typography
                      type={'captionHash'}
                      color={'contentPrimary'}
                      style={{
                        backgroundColor: theme.color.backgroundSecondary,
                        padding: '0 6px',
                        borderRadius: theme.borderRadius.base,
                        wordBreak: 'break-all'
                      }}
                    >
                      <Trans t={t}>
                        {formatTokenBalance(value.value.toString(), 0, 0)}
                      </Trans>
                    </Typography>
                  </>
                )}

                {value.type === 'accountLink' && (
                  <>
                    {Boolean(key) && (
                      <Typography type="captionRegular" color="contentPrimary">
                        <Trans t={t}>{key.toString()}</Trans>
                      </Typography>
                    )}
                    <AccountInfoRow
                      publicKey={value.value.toString()}
                      isAction
                      iconSize={20}
                      csprName={value.accountInfo?.csprName}
                      imgLogo={value.accountInfo?.brandingLogo}
                      accountName={value.accountInfo?.name}
                      accountLink={value.link}
                    />
                  </>
                )}
                {value.type === 'uref' && (
                  <>
                    {Boolean(key) && (
                      <Typography type="captionRegular" color="contentPrimary">
                        <Trans t={t}>{key.toString()}</Trans>
                      </Typography>
                    )}
                    <MaybeLink link={value.link}>
                      <Hash
                        value={value.value.toString()}
                        variant={HashVariant.CaptionHash}
                        label={'Uref'}
                        truncated
                        truncatedSize={'medium'}
                        color={'contentAction'}
                        withCopyOnSelfClick={!value.link}
                      />
                    </MaybeLink>
                  </>
                )}
                {value.type === 'hash' && (
                  <>
                    {Boolean(key) && (
                      <Typography type="captionRegular" color="contentPrimary">
                        <Trans t={t}>{key.toString()}</Trans>
                      </Typography>
                    )}
                    <MaybeLink link={value.link}>
                      <Hash
                        value={value.value.toString()}
                        variant={HashVariant.CaptionHash}
                        label={t('Hash')}
                        truncated
                        truncatedSize={'base'}
                        color={'contentAction'}
                        withCopyOnSelfClick={!value.link}
                      />
                    </MaybeLink>
                  </>
                )}
                {value.type === 'string' && (
                  <span style={{ wordBreak: 'break-word' }}>
                    {Boolean(key) && (
                      <Typography
                        type="captionRegular"
                        color="contentPrimary"
                        style={{ marginRight: 8 }}
                      >
                        <Trans t={t}>{key.toString()}</Trans>
                      </Typography>
                    )}
                    <Typography type={'captionHash'} color={'contentPrimary'}>
                      <Trans t={t}>{value.value.toString()}</Trans>
                    </Typography>
                  </span>
                )}
                {value.type === 'timestamp' && (
                  <span style={{ wordBreak: 'break-word' }}>
                    {Boolean(key) && (
                      <Typography
                        type="captionRegular"
                        color="contentPrimary"
                        style={{ marginRight: 8 }}
                      >
                        <Trans t={t}>{key.toString()}</Trans>
                      </Typography>
                    )}
                    <Typography type={'captionHash'} color={'contentPrimary'}>
                      <Trans t={t}>{formatDate(value.value.toString())}</Trans>
                    </Typography>
                  </span>
                )}
              </AlignedFlexRowContainer>
            );

          case 'list': {
            if (!Array.isArray(value.value)) {
              return null;
            }

            return (
              <>
                {Boolean(key) && key !== '-' && (
                  <Typography
                    type="captionRegular"
                    color="contentPrimary"
                    style={{ marginRight: 8 }}
                  >
                    <Trans t={t}>{key.toString()}</Trans>
                  </Typography>
                )}
                {...value.value
                  .map(arg => renderArg(['-', arg], level + 1))
                  .flat()}
              </>
            );
          }
          case 'map':
            if (Array.isArray(value.value) || typeof value.value !== 'object') {
              return null;
            }

            return (
              <>
                {Boolean(key) && key !== '-' && (
                  <Typography
                    type="captionRegular"
                    color="contentPrimary"
                    style={{ marginRight: 8 }}
                  >
                    <Trans t={t}>{key.toString()}</Trans>
                  </Typography>
                )}
                {...Object.entries(value.value)
                  .map(entry => renderArg(entry, level + 1))
                  .flat()}
              </>
            );
          case 'singleInner':
            if (!Array.isArray(value.value)) {
              return null;
            }

            return renderArg([key, value.value[0]], level);
          case 'resultOk':
            if (!Array.isArray(value.value)) {
              return null;
            }

            return renderArg([key + ' (success)', value.value[0]], level);
          case 'resultErr':
            if (!Array.isArray(value.value)) {
              return null;
            }

            return renderArg([key + ' (failure)', value.value[0]], level);
          case 'tuple':
            if (!Array.isArray(value.value)) {
              return null;
            }

            return (
              <>
                {Boolean(key) && key !== '-' && (
                  <Typography
                    type="captionRegular"
                    color="contentPrimary"
                    style={{ marginRight: 8 }}
                  >
                    <Trans t={t}>{key.toString()}</Trans>
                  </Typography>
                )}
                {...value.value
                  .map(arg => renderArg(['-', arg], level + 1))
                  .flat()}
              </>
            );
          default:
            return null;
        }
      };

      return (
        <LeftAlignedFlexColumn
          gap={SpacingSize.Small}
          style={{ marginLeft: level === 0 ? 0 : 16, minHeight: 24 }}
        >
          {renderValue()}
        </LeftAlignedFlexColumn>
      );
    },
    [t, theme.borderRadius.base, theme.color.backgroundSecondary]
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    if (contentRef.current && action.type) {
      setOverflowing(contentRef.current.scrollHeight > collapsedHeight);
    }
  }, [action.type]);

  return (
    <LeftAlignedFlexColumn gap={SpacingSize.Small}>
      <div
        ref={contentRef}
        style={{
          maxHeight: expanded ? undefined : `${collapsedHeight}px`,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease'
        }}
      >
        {action.type === 'WASM_PROXY' && (
          <AlignedFlexRow gap={SpacingSize.Small}>
            <Typography type="bodySemiBold" color="contentPrimary">
              <Trans t={t}>WASM transaction</Trans>
            </Typography>
            <PortalTooltip
              title={
                <Typography
                  type="captionRegular"
                  overflowWrap
                  color="contentPrimary"
                >
                  <Trans t={t}>
                    This WASM transaction runs code from the smart contract
                    shown below. However, Casper Wallet can’t check what the
                    code inside the WASM actually does.
                  </Trans>
                </Typography>
              }
            >
              <SvgIcon
                src="assets/icons/info.svg"
                size={16}
                color={'contentAction'}
              />
            </PortalTooltip>
          </AlignedFlexRow>
        )}
        <SimpleContainer title={title}>
          {(isTxSignatureRequestUnknownContractAction(action) ||
            isTxSignatureRequestWasmProxyAction(action)) && (
            <AlignedFlexRowContainer gap={SpacingSize.Small}>
              <Typography type="captionRegular" color="contentSecondary">
                <Trans t={t}>with</Trans>
              </Typography>
              <AccountInfoIcon
                publicKey={
                  action.contractPackageHash ?? action.contractHash ?? ''
                }
                size={20}
                accountName={action.contractName ?? ''}
                iconUrl={action.iconUrl}
                defaultSvg={DeployIcon.Generic}
              />
              <MaybeLink link={action.contractLink}>
                <Hash
                  label={
                    action.contractPackageHash
                      ? t('Contract package hash')
                      : action.contractHash
                        ? t('Contract hash')
                        : undefined
                  }
                  value={
                    action.contractPackageHash ?? action.contractHash ?? ''
                  }
                  contractName={action.contractName}
                  variant={HashVariant.CaptionHash}
                  truncated
                  truncatedSize="base"
                  withCopyOnSelfClick={!action.contractLink}
                  color="contentAction"
                />
              </MaybeLink>
              {Boolean(action.contractName ?? '') && (
                <Typography
                  type="captionRegular"
                  color={'contentSecondary'}
                  ellipsis
                  style={{ maxWidth: 123 }}
                >
                  {action.contractName ?? ''}
                </Typography>
              )}
            </AlignedFlexRowContainer>
          )}
          {Boolean(Object.entries(action.args).length) && (
            <LeftAlignedFlexColumn gap={SpacingSize.Small}>
              {...Object.entries(action.args).map(entry => renderArg(entry, 0))}
            </LeftAlignedFlexColumn>
          )}
        </SimpleContainer>
      </div>

      {overflowing && (
        <AlignedFlexRowContainer
          gap={SpacingSize.Small}
          onClick={() => setExpanded(prev => !prev)}
          role={'button'}
          style={{ cursor: 'pointer' }}
        >
          <Typography type="body" color="contentAction">
            <Trans t={t}>{expanded ? 'Show less' : 'Show more'}</Trans>
          </Typography>
          <SvgIcon
            src="assets/icons/chevron.svg"
            size={16}
            color={'contentAction'}
            style={{
              transition: 'transform 0.3s cubic-bezier(.4,2,.6,1), color 0.3s',
              transform: expanded ? 'rotate(-90deg)' : 'rotate(90deg)'
            }}
          />
        </AlignedFlexRowContainer>
      )}
    </LeftAlignedFlexColumn>
  );
};
