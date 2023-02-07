import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  ContentContainer,
  PageContainer,
  ParagraphContainer,
  SpaceBetweenFlexRow
} from '@layout/containers';
import { Accordion, List, SvgIcon, Typography } from '@libs/ui';

import { DeployValue } from './deploy-value';
import {
  CasperDeploy,
  SignatureRequestFields,
  SignatureRequestKeys
} from './deploy-types';
import { deriveDeployInfoFromDeployRaw } from './derive-deploy-info-from-deploy-raw';
import { getDeployParsedValue } from './deploy-utils';

const ListItemContainer = styled(SpaceBetweenFlexRow)`
  margin: 16px;
  width: unset;
`;

const CentredFlexRowSpaceBetweenContainer = styled(SpaceBetweenFlexRow)`
  align-items: center;
  width: unset;
`;

const AccordionHeaderContainer = styled(CentredFlexRowSpaceBetweenContainer)`
  margin: 16px;
`;

const AccordionItem = styled(CentredFlexRowSpaceBetweenContainer)`
  margin: 10px 16px;
`;

const JsonBlock = styled.textarea`
  width: 100%;
  resize: none;
`;

export interface SignDeployContentProps {
  deploy?: CasperDeploy;
}

export function SignDeployContent({ deploy }: SignDeployContentProps) {
  const { t } = useTranslation();

  if (deploy == null) {
    return null;
  }

  const LABEL_DICT: Record<SignatureRequestKeys, string> = {
    signingKey: t('Signing key'),
    account: t('Account'),
    deployHash: t('Deploy hash'),
    delegator: t('Delegator'),
    validator: t('Validator'),
    new_validator: t('New validator'),
    recipient: t('Recipient'),
    amount: t('Amount'),
    transferId: t('Transfer ID'),
    transactionFee: t('Transaction fee'),
    timestamp: t('Timestamp'),
    deployType: t('Deploy type'),
    chainName: t('Chain name'),
    recipientKey: t('Recipient (Key)'),
    recipientHash: t('Recipient (Hash)'),
    entryPoint: t('Entry point'),
    token_metas: t('Token metas')
  };

  const deployInfo = deriveDeployInfoFromDeployRaw(deploy);

  let signatureRequest: SignatureRequestFields = {
    signingKey: deployInfo.signingKey,
    account: deployInfo.account,
    deployHash: deployInfo.deployHash,
    timestamp: deployInfo.timestamp,
    transactionFee: deployInfo.payment,
    chainName: deployInfo.chainName,
    deployType: deployInfo.deployType
  };
  const deployDetailRecords = Object.entries(signatureRequest);
  if (deployInfo.entryPoint != null) {
    deployDetailRecords.push(['entryPoint', deployInfo.entryPoint]);
  }

  const deployArguments = {
    ...deployInfo.deployArgs
  };

  return (
    <PageContainer>
      <ContentContainer>
        <ParagraphContainer gap="big">
          <Typography type="header">
            <Trans t={t}>Signature Request</Trans>
          </Typography>
        </ParagraphContainer>
        <List
          rows={deployDetailRecords.map(([key, value]) => ({
            id: key,
            label: LABEL_DICT[key as keyof typeof signatureRequest],
            value
          }))}
          renderRow={({ id, label, value }) => (
            <ListItemContainer key={id}>
              <Typography type="body" color="contentSecondary">
                {label}
              </Typography>
              <DeployValue id={id} value={value} />
            </ListItemContainer>
          )}
          renderFooter={() => (
            <Accordion
              renderContent={() =>
                Object.entries(deployArguments).map(([key, value]) => {
                  const label =
                    LABEL_DICT[key as keyof typeof signatureRequest] || key;

                  if (typeof value !== 'string') {
                    const { stringValue, isJsonType } =
                      getDeployParsedValue(value);

                    if (isJsonType) {
                      return (
                        <>
                          <AccordionItem>
                            <Typography type="body" color="contentSecondary">
                              {label}
                            </Typography>
                          </AccordionItem>
                          <AccordionItem>
                            <JsonBlock disabled rows={10}>
                              {stringValue}
                            </JsonBlock>
                          </AccordionItem>
                        </>
                      );
                    }
                  }

                  return (
                    <AccordionItem key={key}>
                      <Typography type="body" color="contentSecondary">
                        {label}
                      </Typography>
                      <DeployValue id={key} value={value} />
                    </AccordionItem>
                  );
                })
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
