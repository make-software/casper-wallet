import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { dispatchToMainStore } from '@background/redux/utils';
import { accountRenamed } from '@background/redux/vault/actions';
import { selectVaultAccountsNames } from '@background/redux/vault/selectors';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Button } from '@libs/ui/components';
import {
  RenameAccountFormValues,
  useRenameAccount
} from '@libs/ui/forms/rename-account';

import { RenameAccountPageContent } from './content';

export const RenameAccountPage = () => {
  const navigate = useTypedNavigate();
  const { accountName } = useParams();
  const { t } = useTranslation();

  const existingAccountNames = useSelector(selectVaultAccountsNames);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useRenameAccount(accountName, existingAccountNames);

  function onSubmit({ name }: RenameAccountFormValues) {
    if (!accountName) {
      return;
    }

    dispatchToMainStore(
      accountRenamed({ oldName: accountName, newName: name })
    );
    navigate(RouterPath.AccountSettings.replace(':accountName', name));
  }

  return (
    <PopupLayout
      variant="form"
      onSubmit={handleSubmit(onSubmit)}
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => (
        <RenameAccountPageContent register={register} errors={errors} />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button disabled={!isDirty}>
            <Trans t={t}>Update</Trans>
          </Button>
          <Button
            type="button"
            onClick={() => navigate(-1)}
            color="secondaryBlue"
          >
            <Trans t={t}>Cancel</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
