import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

interface NoProviderProps {
  countryName: string;
  currencyCode: string;
}

export const NoProvider = ({ countryName, currencyCode }: NoProviderProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/empty-state.svg"
          height={120}
          width={200}
        />
      </IllustrationContainer>

      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>No available provider</Trans>
        </Typography>
      </ParagraphContainer>

      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans
            defaults="Oops, currently we can't offer you an on-ramp provider that operates in <bold>{{countryName}}</bold> with <bold>{{ currencyCode }}</bold>. Try a different currency like 'USD', 'EUR' or 'GBP'."
            values={{
              countryName,
              currencyCode
            }}
            components={{ bold: <strong /> }}
          />
        </Typography>
      </ParagraphContainer>
    </ContentContainer>
  );
};
