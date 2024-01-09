import React, { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { PasswordProtectionPage } from 'src/apps/popup/pages/password-protection-page';

import { getBlockExplorerAccountUrl } from '@src/constants';

import { DeleteContactPageContent } from '@popup/pages/contact-details/deleting';
import { ContactDetails } from '@popup/pages/contact-details/details';
import { EditingContactPageContent } from '@popup/pages/contact-details/editing';
import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  contactRemoved,
  contactUpdated
} from '@background/redux/contacts/actions';
import {
  selectAllContacts,
  selectAllContactsNames
} from '@background/redux/contacts/selectors';
import { contactEditingPermissionChanged } from '@background/redux/session/actions';
import { selectIsContactEditingAllowed } from '@background/redux/session/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  AlignedFlexRow,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  SpacingSize
} from '@libs/layout';
import { Button, Link, SvgIcon } from '@libs/ui/components';
import { useContactForm } from '@libs/ui/forms/contact';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';

export const ContactDetailsPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { contactName } = useParams();
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const contacts = useSelector(selectAllContacts);
  const { casperLiveUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const isContactEditingAllowed = useSelector(selectIsContactEditingAllowed);
  const contactsNames = useSelector(selectAllContactsNames);

  const handlePasswordConfirmed = useCallback(() => {
    dispatchToMainStore(contactEditingPermissionChanged());
  }, []);
  const contact = useMemo(
    () => contacts.find(contact => contact.name === contactName),
    [contacts, contactName]
  );
  const existingContactNames = useMemo(
    () => contactsNames.filter(name => name !== contact?.name!),
    [contactsNames, contact?.name]
  );

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid }
  } = useContactForm(existingContactNames, contact?.publicKey!, contact?.name!);

  const isButtonDisabled = useMemo(
    () => calculateSubmitButtonDisabled({ isValid }),
    [isValid]
  );
  const handleCancel = useCallback(() => setIsDeleting(false), []);
  const openEditContact = useCallback(() => setIsEditing(true), []);
  const openDeleteContact = useCallback(() => setIsDeleting(true), []);

  if (!contact) {
    return null;
  }

  if (!isContactEditingAllowed && (isEditing || isDeleting)) {
    return (
      <PasswordProtectionPage setPasswordConfirmed={handlePasswordConfirmed} />
    );
  }

  const submitEditContactForm = handleSubmit(() => {
    const lastModified = new Date().toISOString();

    const { name: newName, publicKey } = getValues();

    dispatchToMainStore(
      contactUpdated({
        oldName: contact.name,
        name: newName.trim(),
        publicKey,
        lastModified
      })
    ).finally(() => {
      navigate(RouterPath.ContactList);
    });
  });

  const submitDeleteContact = () => {
    dispatchToMainStore(contactRemoved(contact.name)).finally(() => {
      navigate(RouterPath.ContactList);
    });
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <>
              <HeaderSubmenuBarNavLink
                linkType={isDeleting ? 'cancel' : 'back'}
              />
              {!isDeleting && !isEditing && (
                <AlignedFlexRow gap={SpacingSize.XL}>
                  <SvgIcon
                    onClick={openEditContact}
                    color="contentAction"
                    src="assets/icons/edit.svg"
                  />
                  <SvgIcon
                    onClick={openDeleteContact}
                    color="contentActionCritical"
                    src="assets/icons/delete.svg"
                  />
                </AlignedFlexRow>
              )}
            </>
          )}
        />
      )}
      renderContent={() => {
        if (isDeleting) {
          return <DeleteContactPageContent />;
        }

        if (isEditing) {
          return (
            <EditingContactPageContent register={register} errors={errors} />
          );
        }

        return <ContactDetails contact={contact} />;
      }}
      renderFooter={() => (
        <FooterButtonsContainer>
          {isDeleting && (
            <>
              <Button color="primaryRed" onClick={submitDeleteContact}>
                <Trans t={t}>Yes, delete</Trans>
              </Button>
              <Button onClick={handleCancel} color="secondaryBlue">
                <Trans t={t}>Cancel</Trans>
              </Button>
            </>
          )}
          {isEditing && (
            <Button onClick={submitEditContactForm} disabled={isButtonDisabled}>
              <Trans t={t}>Save</Trans>
            </Button>
          )}
          {!isDeleting && !isEditing && (
            <Button
              as={props => (
                <Link
                  color="contentAction"
                  target="_blank"
                  href={getBlockExplorerAccountUrl(
                    casperLiveUrl,
                    contact.publicKey
                  )}
                  {...props}
                />
              )}
              color="secondaryBlue"
              title={t('View account in CSPR.live')}
            >
              <Trans t={t}>View on CSPR.live</Trans>
            </Button>
          )}
        </FooterButtonsContainer>
      )}
    />
  );
};
