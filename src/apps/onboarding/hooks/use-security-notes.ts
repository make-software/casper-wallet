import { useTranslation } from 'react-i18next';

export function useSecurityNotes() {
  const { t } = useTranslation();

  return [
    { id: 1, content: t('Save a backup in multiple places.') },
    { id: 2, content: t('Never share the phrase with anyone.') },
    {
      id: 3,
      content: t(
        'Be careful of phishin! Casper Signer will never spontaneously ask for your secret phrase.'
      )
    },
    {
      id: 4,
      content: t(
        'If you need to back up your secret phrase again, you can find it in Settings.'
      )
    },
    { id: 5, content: t('Casper Signer cannot recover your secret phrase.') }
  ];
}
