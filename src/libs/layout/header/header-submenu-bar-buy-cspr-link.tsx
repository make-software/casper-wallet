import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { Link, Typography } from '@libs/ui/components';

export const HeaderSubmenuBarBuyCSPRLink = () => {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  return (
    <Link color="contentAction" onClick={() => navigate(RouterPath.BuyCSPR)}>
      <Typography type="bodySemiBold">
        <Trans t={t}>Buy CSPR</Trans>
      </Typography>
    </Link>
  );
};
