import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AlignedSpaceBetweenFlexRow, FlexColumn } from '@libs/layout';
import { Typography } from '@libs/ui/components';

const Container = styled(FlexColumn)`
  padding: 24px 16px 0;
`;

const RowContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px;
`;

export const Tile = styled.div`
  margin-top: 16px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;
`;

interface SignatureRequestRawJsonProps {
  json: string;
}

export const SignatureRequestRawJson: React.FC<
  SignatureRequestRawJsonProps
> = ({ json }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    container?.scrollTo(0, 0);
  }, []);

  return (
    <Container>
      <Typography
        type={'header'}
        color={'contentPrimary'}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          marginLeft: 16
        }}
      >
        <Trans t={t}>Raw transaction data</Trans>
      </Typography>
      <Tile>
        <RowContainer>
          <Typography
            type={'captionHash'}
            color={'contentPrimary'}
            overflowWrap
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {json}
          </Typography>
        </RowContainer>
      </Tile>
    </Container>
  );
};
