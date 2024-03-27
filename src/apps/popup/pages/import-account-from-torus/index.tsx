import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { dispatchToMainStore } from '@background/redux/utils';
import { accountImported } from '@background/redux/vault/actions';
import { selectVaultAccountsNames } from '@background/redux/vault/selectors';

import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { Account } from '@libs/types/account';
import { Button } from '@libs/ui/components';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import { useImportAccountFromTorus } from '@libs/ui/forms/import-account-from-torus';

import { ImportTorusAccountFailure } from './failure';
import { ImportTorusForm } from './import-form';
import { Instruction } from './instruction';
import { ImportTorusAccountSuccess } from './success';
import { ImportAccountSteps, useImportTorusAccount } from './utils';

export const ImportAccountFromTorusPage = () => {
  const [importStep, setImportStep] = useState(ImportAccountSteps.Instruction);
  const [errorMessage, setErrorMessage] = useState('');

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const existingAccountNames = useSelector(selectVaultAccountsNames);

  const {
    register,
    formState: { errors, isValid },
    handleSubmit
  } = useImportAccountFromTorus(existingAccountNames);

  const isButtonDisabled = calculateSubmitButtonDisabled({ isValid });

  const onSuccess = useCallback(async (accountData: Account) => {
    dispatchToMainStore(accountImported(accountData));
    setImportStep(ImportAccountSteps.Success);
  }, []);
  const onFailure = useCallback((message?: string) => {
    if (message) {
      setErrorMessage(message);
    }
    setImportStep(ImportAccountSteps.Failure);
  }, []);

  const { importTorusAccount } = useImportTorusAccount({
    onSuccess,
    onFailure
  });

  const content = {
    [ImportAccountSteps.Instruction]: <Instruction />,
    [ImportAccountSteps.Form]: (
      <ImportTorusForm register={register} errors={errors} />
    ),
    [ImportAccountSteps.Success]: <ImportTorusAccountSuccess />,
    [ImportAccountSteps.Failure]: (
      <ImportTorusAccountFailure message={errorMessage} />
    )
  };

  const footerButton = {
    [ImportAccountSteps.Instruction]: (
      <Button onClick={() => setImportStep(ImportAccountSteps.Form)}>
        <Trans t={t}>Next</Trans>
      </Button>
    ),
    [ImportAccountSteps.Form]: (
      <Button
        disabled={isButtonDisabled}
        onClick={handleSubmit(({ secretKey, name }) => {
          importTorusAccount(name, secretKey);
        })}
      >
        <Trans t={t}>Import</Trans>
      </Button>
    ),
    [ImportAccountSteps.Success]: (
      <Button onClick={() => navigate(RouterPath.Home)}>
        <Trans t={t}>Done</Trans>
      </Button>
    ),
    [ImportAccountSteps.Failure]: (
      <>
        <Button onClick={() => setImportStep(ImportAccountSteps.Form)}>
          <Trans t={t}>Try again</Trans>
        </Button>
        <Button color="secondaryBlue" onClick={() => navigate(RouterPath.Home)}>
          <Trans t={t}>Maybe later</Trans>
        </Button>
      </>
    )
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType={
                importStep === ImportAccountSteps.Success ? 'close' : 'back'
              }
            />
          )}
        />
      )}
      renderContent={() => content[importStep]}
      renderFooter={() => (
        <FooterButtonsContainer>
          {footerButton[importStep]}
        </FooterButtonsContainer>
      )}
    />
  );
};
