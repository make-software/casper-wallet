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
import { RouterPath, useTypedNavigate } from '@popup/router';

import { SigningRequest } from './types';

function objectKeyToTitle(key: string) {
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
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const {
    signingKey,
    account,
    deployHash,
    timestamp,
    chain,
    payment,
    deployType,
    ...specificRows
  } = request;

  const generalRows = {
    signingKey,
    account,
    deployHash,
    timestamp,
    chain,
    payment,
    deployType
  };

  const keysWithHashes = [
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
          rows={Object.entries(generalRows).map(([key, value]) => ({
            id: key,
            title: objectKeyToTitle(key),
            value
          }))}
          renderRow={({ id, title, value }) => (
            <ListItemContainer key={id}>
              <Typography type="body" weight="regular" color="contentSecondary">
                {title}
              </Typography>
              {keysWithHashes.includes(id) ? (
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
                Object.entries(specificRows).map(([key, value]) => {
                  const id = key;
                  const title = objectKeyToTitle(key);

                  return (
                    <AccordionRowContainer key={id}>
                      <Typography
                        type="body"
                        weight="regular"
                        color="contentSecondary"
                      >
                        {title}
                      </Typography>
                      {keysWithHashes.includes(id) ? (
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
                  );
                })
              }
              children={({ isOpen }) => (
                <AccordionHeaderContainer>
                  <Typography type="body" weight="bold">
                    {deployType === 'Contract Call'
                      ? 'Contract arguments'
                      : 'Transfer Data'}
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
        <Button color="secondaryBlue" onClick={() => navigate(RouterPath.Home)}>
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsContainer>
    </PageContainer>
  );
}

export * from './mocked-data';
