import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { formatCep18Tokens } from '@popup/pages/home/components/tokens-list/utils';

import { TokenType, useCasperToken } from '@hooks/use-casper-token';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { useFetchCep18Tokens } from '@libs/services/cep18-service';
import {
  ActiveAccountPlate,
  List,
  Modal,
  ModalSwitcher,
  Typography
} from '@libs/ui/components';

import { TokenRow } from './components/token-row';
import { TokenSwitcherRow } from './components/token-swticher-row';

interface TokenStepProps {
  setSelectedToken: React.Dispatch<
    React.SetStateAction<TokenType | null | undefined>
  >;
  setIsErc20Transfer: (value: React.SetStateAction<boolean>) => void;
  selectedToken: TokenType | null | undefined;
}

export const TokenStep = ({
  setSelectedToken,
  setIsErc20Transfer,
  selectedToken
}: TokenStepProps) => {
  const [tokenList, setTokenList] = useState<TokenType[]>([]);
  const { t } = useTranslation();

  const casperToken = useCasperToken();
  const { cep18Tokens, isLoadingTokens } = useFetchCep18Tokens();

  useEffect(() => {
    const tokensList: TokenType[] = [];

    if (isLoadingTokens) return;
    const formatedCep18Tokens = formatCep18Tokens(cep18Tokens);

    if (casperToken) {
      tokensList.push(casperToken);
    }

    if (formatedCep18Tokens) {
      tokensList.push(...formatedCep18Tokens);
    }

    setTokenList(tokensList);

    const token = tokensList.find(token => token.id === selectedToken?.id);

    if (token) {
      setSelectedToken(token);
    } else {
      setSelectedToken(casperToken);
    }
  }, [
    casperToken,
    cep18Tokens,
    isLoadingTokens,
    selectedToken?.id,
    setSelectedToken
  ]);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Select token and account</Trans>
        </Typography>
      </ParagraphContainer>

      <ParagraphContainer top={SpacingSize.XXL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>Token</Trans>
        </Typography>
      </ParagraphContainer>

      <Modal
        style={{ height: '528px' }}
        renderContent={({ closeModal }) => (
          <ModalSwitcher label="Token" closeSwitcher={closeModal}>
            <List
              rows={tokenList}
              renderRow={token => {
                const isSelected = token.name === selectedToken?.name;

                return (
                  <TokenRow
                    token={token}
                    isSelected={isSelected}
                    handleSelect={e => {
                      setSelectedToken(token);
                      if (token.name === 'Casper') {
                        setIsErc20Transfer(false);
                      } else {
                        setIsErc20Transfer(true);
                      }
                      closeModal(e);
                    }}
                  />
                );
              }}
              marginLeftForItemSeparatorLine={54}
            />
          </ModalSwitcher>
        )}
        placement="fullBottom"
        children={() => (
          <TokenSwitcherRow
            tokenName={selectedToken?.name}
            iconUrl={selectedToken?.icon}
          />
        )}
      />

      <ActiveAccountPlate
        label="From"
        balance={selectedToken?.amount}
        symbol={selectedToken?.symbol || null}
        top={SpacingSize.XL}
      />
    </ContentContainer>
  );
};
