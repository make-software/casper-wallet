import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui';
import { AddContactPageContent } from '@popup/pages/add-contact/content';
import { ContactFromValues, useContactForm } from '@libs/ui/forms/contact';
import { selectAllContactsNames } from '@background/redux/contacts/selectors';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { dispatchToMainStore } from '@background/redux/utils';
import { newContactAdded } from '@background/redux/contacts/actions';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';
import { SuccessScreen } from '@popup/pages/add-contact/success-screen';

export const AddContactPage = () => {
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { state } = useTypedLocation();

  const contactsNames = useSelector(selectAllContactsNames);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useContactForm(contactsNames, state?.recipientPublicKey);

  const onSubmit = ({ name, publicKey }: ContactFromValues) => {
    const lastModified = new Date().toISOString();

    dispatchToMainStore(
      newContactAdded({ name, publicKey, lastModified: lastModified })
    ).finally(() => {
      setShowSuccessScreen(true);
    });
  };

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        !showSuccessScreen && handleSubmit(onSubmit)();
      }
    };

    window.addEventListener('keydown', keyDownHandler);

    return () => window.removeEventListener('keydown', keyDownHandler);
  }, [handleSubmit, navigate, showSuccessScreen]);

  const isButtonDisabled = calculateSubmitButtonDisabled({ isValid });
  const needToRedirectToHome = Boolean(state?.recipientPublicKey);

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType={
                showSuccessScreen || needToRedirectToHome ? 'close' : 'back'
              }
              onClick={() => {
                if (needToRedirectToHome) {
                  navigate(RouterPath.Home);
                  return;
                }
                showSuccessScreen
                  ? navigate(RouterPath.ContactList)
                  : navigate(-1);
              }}
            />
          )}
        />
      )}
      renderContent={() =>
        showSuccessScreen ? (
          <SuccessScreen needToRedirectToHome={needToRedirectToHome} />
        ) : (
          <AddContactPageContent register={register} errors={errors} />
        )
      }
      renderFooter={() => (
        <FooterButtonsContainer>
          {showSuccessScreen ? (
            <Button
              onClick={() =>
                needToRedirectToHome
                  ? navigate(RouterPath.Home)
                  : navigate(RouterPath.ContactList)
              }
            >
              <Trans t={t}>Done</Trans>
            </Button>
          ) : (
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isButtonDisabled}
            >
              <Trans t={t}>Add contact</Trans>
            </Button>
          )}
        </FooterButtonsContainer>
      )}
    />
  );
};
