import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Typography } from '@libs/ui/components';

interface ValidatorStepProps {
  children?: React.ReactNode;
  headerText: string;
}
export const ValidatorStep = ({ headerText, children }: ValidatorStepProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>{headerText}</Trans>
        </Typography>
      </ParagraphContainer>

      {children}
    </ContentContainer>
  );
};
