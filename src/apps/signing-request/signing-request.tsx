import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { closeActiveWindow } from '@src/background/close-window';
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

import { casperDeployMock } from './mocked-data';
import { DeployArguments, isKeyOfHashValue, SignatureRequest } from './types';
import { emitSdkEventToAllActiveTabs } from '@src/content/sdk-event';
import { signDeploy } from './sign-deploy';
import { sdkMessage } from '@src/content/sdk-message';
import { useSelector } from 'react-redux';
import { selectVaultActiveAccount } from '@src/background/redux/vault/selectors';

function keyToTitle(key: string) {
  const spacedString = key.replace(/([A-Z]+|\d+)/g, ' $1');
  return `${spacedString[0].toUpperCase()}${spacedString.slice(1)}`;
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
  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    throw Error('Missing search param');
  }

  const activeAccount = useSelector(selectVaultActiveAccount);

  const casperDeploy = casperDeployMock;

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
    //TODO: should be taken from casper deploy
  };

  const deployArguments: DeployArguments = {
    //TODO: should be taken from casper deploy
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
            label: keyToTitle(key),
            value
          }))}
          renderRow={({ id, label, value }) => (
            <ListItemContainer key={id}>
              <Typography type="body" weight="regular" color="contentSecondary">
                {label}
              </Typography>
              {isKeyOfHashValue(id) ? (
                <Hash
                  value={value as string}
                  variant={HashVariant.BodyHash}
                  color="contentPrimary"
                />
              ) : (
                <Typography type="body" weight="regular">
                  {value}
                </Typography>
              )}
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
                      {keyToTitle(key)}
                    </Typography>
                    {isKeyOfHashValue(key) ? (
                      <Hash
                        value={value as string}
                        variant={HashVariant.BodyHash}
                        color="contentPrimary"
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
