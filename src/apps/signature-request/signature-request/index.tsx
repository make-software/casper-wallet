import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { closeActiveWindow } from '@background/close-window';
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

import {
  DeployArguments,
  DeployType,
  isKeyOfHashValue,
  isKeyOfPriceValue,
  SignatureRequest
} from '../types';
import { emitSdkEventToAllActiveTabs } from '@content/sdk-event';
import { signDeploy } from '../sign-deploy';
import { sdkMessage } from '@content/sdk-message';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { useDeriveDataFromDeployRaw } from '../hooks/use-derive-data-from-deploy-raw';
import { useMockedDeployData } from '../signature-request/hooks/use-mocked-deploy-data';

function stringValueToNumberInStringWithSpaces(value: string) {
  const numericValue = Number.parseInt(value);

  if (Number.isNaN(numericValue)) {
    throw new Error("Can't convert string value to number");
  }

  return numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

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

interface SignatureRequestPageProps {}

export function SignatureRequestPage(props: SignatureRequestPageProps) {
  const { t } = useTranslation();

  const labelDict: Record<
    keyof SignatureRequest | keyof DeployArguments,
    string
  > = {
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
    entryPoint: t('Entry point')
  };

  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');
  const testEntryPoint = searchParams.get('testEntryPoint');

  if (!requestId || !testEntryPoint) {
    throw Error('Missing search param');
  }

  const activeAccount = useSelector(selectVaultActiveAccount);

  const casperDeploy = useMockedDeployData(testEntryPoint);
  const deployInfo = useDeriveDataFromDeployRaw(casperDeploy);

  const handleSign = useCallback(() => {
    if (activeAccount?.publicKey == null || activeAccount.secretKey == null) {
      throw Error('No active account during signing');
    }
    const signature = signDeploy(
      casperDeploy.hash,
      activeAccount.publicKey,
      activeAccount.secretKey
    );
    emitSdkEventToAllActiveTabs(
      sdkMessage.signResponse({ signature }, { requestId })
    );
  }, [
    activeAccount?.publicKey,
    activeAccount?.secretKey,
    casperDeploy.hash,
    requestId
  ]);

  // @ts-ignore
  const signatureRequest: SignatureRequest = {
    account: deployInfo.account,
    deployHash: deployInfo.deployHash,
    timestamp: deployInfo.timestamp,
    transactionFee: deployInfo.payment,
    chainName: deployInfo.chainName,
    deployType: deployInfo.deployType as DeployType
  };

  const deployArguments: DeployArguments = {
    //TODO: should be taken from casper deploy
  };

  function renderRowValue(id: string, value: string) {
    if (isKeyOfHashValue(id)) {
      return (
        <Hash
          value={value}
          variant={HashVariant.BodyHash}
          color="contentPrimary"
          truncated
        />
      );
    }

    if (isKeyOfPriceValue(id)) {
      return (
        <Hash
          value={stringValueToNumberInStringWithSpaces(value)}
          variant={HashVariant.BodyHash}
          color="contentPrimary"
        />
      );
    }

    return (
      <Typography type="body" weight="regular">
        {value}
      </Typography>
    );
  }

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
            label: labelDict[key as keyof typeof signatureRequest],
            value
          }))}
          renderRow={({ id, label, value }) => (
            <ListItemContainer key={id}>
              <Typography type="body" weight="regular" color="contentSecondary">
                {label}
              </Typography>
              {renderRowValue(id, value)}
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
                      {labelDict[key as keyof typeof deployArguments]}
                    </Typography>
                    {isKeyOfHashValue(key) ? (
                      <Hash
                        value={value as string}
                        variant={HashVariant.BodyHash}
                        color="contentPrimary"
                        truncated
                      />
                    ) : (
                      <Typography type="body" weight="regular">
                        {value}
                      </Typography>
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
