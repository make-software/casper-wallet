import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { ContractPackageWithBalance } from '@libs/services/erc20-service';
import {
  CasperTokenTransferDeploysList,
  Cep18TokenDeploysList,
  Typography
} from '@libs/ui/components';

import { Token } from './token';

interface TokenPageContentProps {
  erc20Tokens: ContractPackageWithBalance[] | null;
}

export const TokenPageContent: React.FC<TokenPageContentProps> = ({
  erc20Tokens
}) => {
  const { t } = useTranslation();

  const { tokenName } = useParams();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Token</Trans>
        </Typography>
      </ParagraphContainer>
      <Token erc20Tokens={erc20Tokens} />
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Activity</Trans>
        </Typography>
      </ParagraphContainer>
      {tokenName === 'Casper' ? (
        <CasperTokenTransferDeploysList />
      ) : (
        <Cep18TokenDeploysList />
      )}
    </ContentContainer>
  );
};
