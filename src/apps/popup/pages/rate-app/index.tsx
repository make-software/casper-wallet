import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Browser } from '@src/constants';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  askForReviewAfterChanged,
  ratedInStoreChanged
} from '@background/redux/rate-app/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { Content } from './content';
import { RateAppLinks, RateAppSteps, getBrowserFromUserAgent } from './utils';

export const RateAppPage = () => {
  const [reviewStep, setReviewStep] = useState<RateAppSteps>(
    RateAppSteps.Navigation
  );
  const [browser, setBrowser] = useState<Browser | 'Unknown'>(Browser.Chrome);

  useEffect(() => {
    setBrowser(getBrowserFromUserAgent());
  }, []);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const content = {
    [RateAppSteps.Navigation]: (
      <Content
        headerText="Are you enjoying Casper Wallet so far?"
        contentText="We thrive on feedback. Let us know how we're doing."
        imageName="welcome-2.svg"
      />
    ),
    [RateAppSteps.Rate]: (
      <Content
        headerText="Thanks! You made our day"
        contentText="It would mean the world to us if you'd take a few moments to share a
            review on our app page. Our team reads every user review posted!"
        imageName="review.svg"
      />
    ),
    [RateAppSteps.Support]: (
      <Content
        headerText="We'd love to hear more from you"
        contentText="We strive to create the best Wallet experience possible. Please get
            in touch and tell us how we can do better."
        imageName="chat.svg"
      />
    )
  };

  const footerButtons = {
    [RateAppSteps.Navigation]: (
      <>
        <Button onClick={() => setReviewStep(RateAppSteps.Rate)}>
          <Trans t={t}>Yes, I'm enjoying it</Trans>
        </Button>
        <Button
          color="secondaryBlue"
          onClick={() => setReviewStep(RateAppSteps.Support)}
        >
          <Trans t={t}>Not so much</Trans>
        </Button>
      </>
    ),
    [RateAppSteps.Rate]: (
      <Button
        onClick={() => {
          dispatchToMainStore(ratedInStoreChanged(true));

          window.open(RateAppLinks[browser], '_blank');
          navigate(RouterPath.Home);
        }}
      >
        <Trans t={t}>Leave a review</Trans>
      </Button>
    ),
    [RateAppSteps.Support]: (
      <>
        <Button
          onClick={() => {
            const date = new Date();
            const datePlusFourMonth = date.setMonth(date.getMonth() + 4);

            dispatchToMainStore(ratedInStoreChanged(false));
            dispatchToMainStore(askForReviewAfterChanged(datePlusFourMonth));

            window.open('https://t.me/CSPRhub/4689', '_blank');
            navigate(RouterPath.Home);
          }}
        >
          <Trans t={t}>Get in touch</Trans>
        </Button>
        <Button
          color="secondaryBlue"
          onClick={() => {
            const date = new Date();
            const datePlusFourMonth = date.setMonth(date.getMonth() + 1);

            dispatchToMainStore(ratedInStoreChanged(false));
            dispatchToMainStore(askForReviewAfterChanged(datePlusFourMonth));

            navigate(RouterPath.Home);
          }}
        >
          <Trans t={t}>Maybe later</Trans>
        </Button>
      </>
    )
  };

  const headerButtons = {
    [RateAppSteps.Navigation]: (
      <HeaderSubmenuBarNavLink
        linkType="close"
        onClick={() => {
          const date = new Date();
          const datePlusOneMonth = date.setMonth(date.getMonth() + 1);

          dispatchToMainStore(ratedInStoreChanged(false));
          dispatchToMainStore(askForReviewAfterChanged(datePlusOneMonth));

          navigate(RouterPath.Home);
        }}
      />
    ),
    [RateAppSteps.Rate]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setReviewStep(RateAppSteps.Navigation)}
      />
    ),
    [RateAppSteps.Support]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setReviewStep(RateAppSteps.Navigation)}
      />
    )
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => headerButtons[reviewStep]}
        />
      )}
      renderContent={() => content[reviewStep]}
      renderFooter={() => (
        <FooterButtonsContainer>
          {footerButtons[reviewStep]}
        </FooterButtonsContainer>
      )}
    />
  );
};
