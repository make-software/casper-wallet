import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

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

import { SigningRequest } from './types';
import { closeWindow } from '@connect-to-app/utils/closeWindow';

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

interface SignatureRequestPageProps {
  request: SigningRequest;
}

export function SignatureRequestPage({ request }: SignatureRequestPageProps) {
  const { t } = useTranslation();

  const {
    signingKey,
    account,
    deployHash,
    timestamp,
    chain,
    payment,
    deployType,
    ...accordionContent
  } = request;

  const listContent = {
    signingKey,
    account,
    deployHash,
    timestamp,
    chain,
    payment,
    deployType
  };

  const keysOfHashedValues = [
    'signingKey',
    'account',
    'deployHash',
    'payment',
    'delegator',
    'validator',
    'amount',
    'recipient',
    'transferId'
  ];

  return (
    <PageContainer>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header" weight="bold">
            <Trans t={t}>Signature Request</Trans>
          </Typography>
        </HeaderTextContainer>
        <List
          rows={Object.entries(listContent).map(([key, value]) => ({
            id: key,
            title: keyToTitle(key),
            value
          }))}
          renderRow={({ id, title, value }) => (
            <ListItemContainer key={id}>
              <Typography type="body" weight="regular" color="contentSecondary">
                {title}
              </Typography>
              {keysOfHashedValues.includes(id) ? (
                <Hash
                  value={value as string}
                  variant={HashVariant.BodyHash}
                  color="contentPrimary"
                  // truncated={true}
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
                Object.entries(accordionContent).map(([key, value]) => (
                  <AccordionRowContainer key={key}>
                    <Typography
                      type="body"
                      weight="regular"
                      color="contentSecondary"
                    >
                      {keyToTitle(key)}
                    </Typography>
                    {keysOfHashedValues.includes(key) ? (
                      <Hash
                        value={value as string}
                        variant={HashVariant.BodyHash}
                        color="contentPrimary"
                        // truncated={true}
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
                    {deployType === 'Contract Call'
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
        <Button color="primaryRed">
          <Trans t={t}>Sign</Trans>
        </Button>
        <Button color="secondaryBlue" onClick={() => closeWindow()}>
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsContainer>
    </PageContainer>
  );
}
