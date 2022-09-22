import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { DeployUtil } from 'casper-js-sdk';

import { closeActiveWindow } from '@background/close-window';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { emitSdkEventToAllActiveTabs } from '@content/sdk-event';
import { sdkMessage } from '@content/sdk-message';
import {
  ContentContainer,
  FooterButtonsContainer,
  HeaderTextContainer,
  PageContainer
} from '@layout/containers';
import {
  Accordion,
  Button,
  Hash,
  HashVariant,
  List,
  SvgIcon,
  Typography
} from '@libs/ui';
import { selectDeploysJsonById } from '@src/background/redux/deploys/selectors';

import { useDeriveDataFromDeployRaw } from './use-derive-data-from-deploy-raw';
import { signDeploy } from './sign-deploy';
import { SignatureRequestValue } from './signature-request-value';
import {
  isKeyOfHashValue,
  SignatureRequestFields,
  SignatureRequestArguments,
  SignatureRequestKeys
} from './types';

const ListItemContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 16px;
`;

const CentredFlexRowSpaceBetweenContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AccordionHeaderContainer = styled(CentredFlexRowSpaceBetweenContainer)`
  margin: 16px;
`;

const AccordionRowContainer = styled(CentredFlexRowSpaceBetweenContainer)`
  margin: 10px 16px;
`;

export function SignatureRequestPage() {
  const { t } = useTranslation();

  const LABEL_DICT: Record<SignatureRequestKeys, string> = {
    signingKey: t('Signing key'),
    account: t('Account'),
    deployHash: t('Deploy hash'),
    delegator: t('Delegator'),
    validator: t('Validator'),
    recipient: t('Recipient'),
    amount: t('Amount'),
    transferId: t('Transfer ID'),
    transactionFee: t('Transaction fee'),
    timestamp: t('Timestamp'),
    deployType: t('Deploy type'),
    chainName: t('Chain name'),
    recipientKey: t('Recipient (Key)'),
    recipientHash: t('Recipient (Hash)'),
    newValidator: t('New validator'),
    entryPoint: t('Entry point')
  };

  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    throw Error('Missing search param');
  }

  const activeAccount = useSelector(selectVaultActiveAccount);
  if (activeAccount?.publicKey == null) {
    throw Error('No active account');
  }

  const deployJsonById = useSelector(selectDeploysJsonById);
  const deployJson = deployJsonById[requestId];
  const res = DeployUtil.deployFromJson(deployJson);
  if (!res.ok) {
    throw Error('Deploy Error');
  }

  const deploy = res.val;
  const deployInfo = useDeriveDataFromDeployRaw(deploy);

  const handleSign = useCallback(() => {
    const signature = signDeploy(
      deploy.hash,
      activeAccount.publicKey,
      activeAccount.secretKey
    );
    emitSdkEventToAllActiveTabs(
      sdkMessage.signResponse({ signature }, { requestId })
    );
    closeActiveWindow();
  }, [
    activeAccount?.publicKey,
    activeAccount?.secretKey,
    deploy.hash,
    requestId
  ]);

  let signatureRequest: SignatureRequestFields = {
    signingKey: deployInfo.signingKey,
    account: deployInfo.account,
    deployHash: deployInfo.deployHash,
    timestamp: deployInfo.timestamp,
    transactionFee: deployInfo.payment,
    chainName: deployInfo.chainName,
    deployType: deployInfo.deployType
  };

  const deployArguments: SignatureRequestArguments = {
    ...deployInfo.deployArgs
  };

  return (
    <PageContainer>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header" weight="bold">
            <Trans t={t}>Signature Request</Trans>
          </Typography>
        </HeaderTextContainer>
        <List
          rows={Object.entries(signatureRequest).map(([key, value]) => ({
            id: key,
            label: LABEL_DICT[key as keyof typeof signatureRequest],
            value
          }))}
          renderRow={({ id, label, value }) => (
            <ListItemContainer key={id}>
              <Typography type="body" weight="regular" color="contentSecondary">
                {label}
              </Typography>
              <SignatureRequestValue id={id} value={value} />
            </ListItemContainer>
          )}
          renderFooter={() => (
            <Accordion
              renderContent={() =>
                Object.entries(deployArguments).map(([key, value]) => (
                  <AccordionRowContainer key={key}>
                    <Typography
                      type="body"
                      weight="regular"
                      color="contentSecondary"
                    >
                      {LABEL_DICT[key as keyof typeof deployArguments]}
                    </Typography>
                    {isKeyOfHashValue(key) ? (
                      <Hash
                        value={value as string}
                        variant={HashVariant.BodyHash}
                        color="contentPrimary"
                        truncated
                      />
                    ) : (
                      <SignatureRequestValue id={key} value={value} />
                    )}
                  </AccordionRowContainer>
                ))
              }
              children={({ isOpen }) => (
                <AccordionHeaderContainer>
                  <Typography type="body" weight="bold">
                    {signatureRequest.deployType === 'Contract Call'
                      ? t('Contract arguments')
                      : t('Transfer Data')}
                  </Typography>
                  <SvgIcon
                    src="assets/icons/chevron-up.svg"
                    flipByAxis={isOpen ? undefined : 'X'}
                  />
                </AccordionHeaderContainer>
              )}
              disableClickAway={true}
            />
          )}
          marginLeftForItemSeparatorLine={16}
        />
      </ContentContainer>
      <FooterButtonsContainer>
        <Button color="primaryRed" onClick={handleSign}>
          <Trans t={t}>Sign</Trans>
        </Button>
        <Button color="secondaryBlue" onClick={() => closeActiveWindow()}>
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsContainer>
    </PageContainer>
  );
}
