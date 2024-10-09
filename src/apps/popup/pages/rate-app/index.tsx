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

/**
 * The main RateApp page component.
 *
 * @component
 * @name RateAppPage
 */
export const RateAppPage = () => {
  const [reviewStep, setReviewStep] = useState<RateAppSteps>(
    RateAppSteps.Navigation
  );
  const [browser, setBrowser] = useState<Browser | 'Unknown'>(Browser.Chrome);

  // Runs once on component mount to determine the user's browser.
  useEffect(() => {
    setBrowser(getBrowserFromUserAgent());
  }, []);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  /**
   * Defines the content to be displayed based on the current rate app step.
   */
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

  /**
   * Defines footer buttons to be shown based on the current rate app step.
   * The button actions dispatch relevant actions to the Redux store and set the rate app step or navigation path accordingly.
   */
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
            const date = new Date(); // This will get current date
            const datePlusFourMonth = date.setMonth(date.getMonth() + 4); //This will set date 4 month ahead.

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
            const date = new Date(); // This will get current date
            const datePlusFourMonth = date.setMonth(date.getMonth() + 1); //This will set a date 1 month ahead.

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

  /**
   * Defines header buttons to be shown based on the current rate app step.
   * The actions dispatch relevant actions to the Redux store and set the rate app step or navigation path accordingly.
   */
  const headerButtons = {
    [RateAppSteps.Navigation]: (
      <HeaderSubmenuBarNavLink
        linkType="close"
        onClick={() => {
          const date = new Date(); // This will get current date
          const datePlusOneMonth = date.setMonth(date.getMonth() + 1); //This will set a date 1 month ahead.

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

  /**
   * Generates the page layout, including the header, main content and footer.
   */
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
