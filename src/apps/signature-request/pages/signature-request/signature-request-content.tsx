import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  ContentContainer,
  PageContainer,
  TextContainer
} from '@layout/containers';
import {
  Accordion,
  Hash,
  HashVariant,
  List,
  SvgIcon,
  Typography
} from '@libs/ui';

import { SignatureRequestValue } from './signature-request-value';
import {
  CasperDeploy,
  isKeyOfHashValue,
  SignatureRequestArguments,
  SignatureRequestFields,
  SignatureRequestKeys
} from './types';
import { useDeriveDeployInfoFromDeployRaw } from './use-derive-deploy-info-from-deploy-raw';

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

export interface SignatureRequestViewProps {
  deploy: CasperDeploy;
}

export function SignatureRequestContent({ deploy }: SignatureRequestViewProps) {
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

  const deployInfo = useDeriveDeployInfoFromDeployRaw(deploy);

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
        <TextContainer gap="big">
          <Typography type="header">
            <Trans t={t}>Signature Request</Trans>
          </Typography>
        </TextContainer>
        <List
          rows={Object.entries(signatureRequest).map(([key, value]) => ({
            id: key,
            label: LABEL_DICT[key as keyof typeof signatureRequest],
            value
          }))}
          renderRow={({ id, label, value }) => (
            <ListItemContainer key={id}>
              <Typography type="body" color="contentSecondary">
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
                    <Typography type="body" color="contentSecondary">
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
                  <Typography type="bodySemiBold">
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
    </PageContainer>
  );
}
