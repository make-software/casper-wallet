import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useActiveAccountErc20Tokens } from '@hooks/use-active-account-erc20-tokens';
import { TokenType, useCasperToken } from '@hooks/use-casper-token';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
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
  const { tokens } = useActiveAccountErc20Tokens();

  useEffect(() => {
    const tokensList: TokenType[] = [];

    if (casperToken) {
      tokensList.push(casperToken);
    }

    if (tokens) {
      tokensList.push(...tokens);
    }

    setTokenList(tokensList);
  }, [casperToken, tokens]);

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Select token and account</Trans>
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
        balance={selectedToken?.amount || null}
        symbol={selectedToken?.symbol || null}
        top={SpacingSize.XL}
      />
    </ContentContainer>
  );
};
