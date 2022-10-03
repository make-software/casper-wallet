import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  LayoutTab,
  TabFooterContainer,
  HeaderSubmenuBarNavLink
} from '@libs/layout';
import { Button } from '@libs/ui';

import { RouterPath } from '@src/apps/onboarding/router';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { useWordsCollection } from '@src/apps/onboarding/components/secret-phrase-words-view/hooks/use-words-collection';
import { mockedMnemonicPhrase } from '@src/apps/onboarding/mockedData';

import { ConfirmSecretPhrasePageContent } from './content';

export function ConfirmSecretPhrasePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const wordsCollection = useWordsCollection(mockedMnemonicPhrase);

  function handleSubmit() {
    const { phraseString, partialWords } = wordsCollection;
    const enteredPhraseString = partialWords.join(' ');

    if (phraseString === enteredPhraseString) {
      navigate(RouterPath.SecretPhraseConfirmed);
    } else {
      navigate(RouterPath.Error, {
        state: {
          errorHeaderText: t('Ah, that’s not guite a correct secret phrase'),
          errorContentText: t(
            'You can start over again. Make sure you save your secret phrase as a text file or write it down somewhere.'
          ),
          errorPrimaryButtonLabel: t('Start over again')
        }
      });
    }
  }

  const isSubmitButtonDisabled = wordsCollection.selectedWords.length < 6;

  return (
    <LayoutTab
      layoutContext="withStepper"
      renderHeader={() => <HeaderSubmenuBarNavLink linkType="back" />}
      renderContent={() => (
        <ConfirmSecretPhrasePageContent phrase={mockedMnemonicPhrase} />
      )}
      renderFooter={() => (
        <TabFooterContainer>
          <Button disabled={isSubmitButtonDisabled} onClick={handleSubmit}>
            <Trans t={t}>Confirm</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
