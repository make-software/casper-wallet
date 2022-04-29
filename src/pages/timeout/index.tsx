import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Typography, List, Checkbox } from '@src/libs/ui';
import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';

import { selectTimeout } from '@src/redux/vault/selectors';
import styled from 'styled-components';
import { changeTimeout, startTimeout } from '@src/redux/vault/actions';
import { Trans, useTranslation } from 'react-i18next';

const Container = styled.div`
  height: 50px;

  display: flex;
  align-items: center;

  &:last-child {
    margin-right: 16px;
  }
`;

export function TimeoutPageContent() {
  const { t } = useTranslation();
  const timeout = useSelector(selectTimeout);
  const dispatch = useDispatch();

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          <Trans t={t}>Timeout</Trans>
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" variation="contentSecondary">
          <Trans t={t}>
            Your vault will be automatically locked after some period of
            inactivity.
          </Trans>
        </Typography>
        <List
          items={[
            {
              id: 1,
              item: {
                Content: (
                  <Container>
                    <Typography type="body" weight="regular">
                      <Trans t={t}>1 min</Trans>
                    </Typography>
                  </Container>
                ),
                Right: (
                  <Container>
                    <Checkbox checked={timeout === '1min'} />
                  </Container>
                )
              },
              onClick: () => {
                dispatch(changeTimeout({ timeout: '1min' }));
                dispatch(startTimeout());
              }
            },
            {
              id: 2,
              item: {
                Content: (
                  <Container>
                    <Typography type="body" weight="regular">
                      <Trans t={t}>5 min</Trans>
                    </Typography>
                  </Container>
                ),
                Right: (
                  <Container>
                    <Checkbox checked={timeout === '5min'} />
                  </Container>
                )
              },
              onClick: () => {
                dispatch(changeTimeout({ timeout: '5min' }));
                dispatch(startTimeout());
              }
            },
            {
              id: 3,
              item: {
                Content: (
                  <Container>
                    <Typography type="body" weight="regular">
                      <Trans t={t}>15 min</Trans>
                    </Typography>
                  </Container>
                ),
                Right: (
                  <Container>
                    <Checkbox checked={timeout === '15min'} />
                  </Container>
                )
              },
              onClick: () => {
                dispatch(changeTimeout({ timeout: '15min' }));
                dispatch(startTimeout());
              }
            },
            {
              id: 4,
              item: {
                Content: (
                  <Container>
                    <Typography type="body" weight="regular">
                      <Trans t={t}>30 min</Trans>
                    </Typography>
                  </Container>
                ),
                Right: (
                  <Container>
                    <Checkbox checked={timeout === '30min'} />
                  </Container>
                )
              },
              onClick: () => {
                dispatch(changeTimeout({ timeout: '30min' }));
                dispatch(startTimeout());
              }
            },
            {
              id: 5,
              item: {
                Content: (
                  <Container>
                    <Typography type="body" weight="regular">
                      <Trans t={t}>1 hour</Trans>
                    </Typography>
                  </Container>
                ),
                Right: (
                  <Container>
                    <Checkbox checked={timeout === '1hour'} />
                  </Container>
                )
              },
              onClick: () => {
                dispatch(changeTimeout({ timeout: '1hour' }));
                dispatch(startTimeout());
              }
            },
            {
              id: 6,
              item: {
                Content: (
                  <Container>
                    <Typography type="body" weight="regular">
                      <Trans t={t}>24 hours</Trans>
                    </Typography>
                  </Container>
                ),
                Right: (
                  <Container>
                    <Checkbox checked={timeout === '24hours'} />
                  </Container>
                )
              },
              onClick: () => {
                dispatch(changeTimeout({ timeout: '24hours' }));
                dispatch(startTimeout());
              }
            }
          ]}
        />
      </TextContainer>
    </ContentContainer>
  );
}
