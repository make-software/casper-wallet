import JSZip from 'jszip';
import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PasswordProtectionPage } from '@popup/pages/password-protection-page';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import {
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';
import { AccountListRows } from '@libs/types/account';
import { Button } from '@libs/ui/components';

import { Download } from './download';
import { Instruction } from './instruction';
import { Success } from './success';
import { DownloadAccountKeysSteps, downloadFile } from './utils';

export const DownloadAccountKeysPage = () => {
  const [isPasswordConfirmed, setIsPasswordConfirmed] =
    useState<boolean>(false);
  const [downloadAccountKeysStep, setDownloadAccountKeysStep] = useState(
    DownloadAccountKeysSteps.Instruction
  );
  const [selectedAccounts, setSelectedAccounts] = useState<AccountListRows[]>(
    []
  );

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const setPasswordConfirmed = useCallback(() => {
    setIsPasswordConfirmed(true);
  }, []);

  if (!isPasswordConfirmed) {
    return (
      <PasswordProtectionPage setPasswordConfirmed={setPasswordConfirmed} />
    );
  }

  const downloadKeys = async () => {
    const zip = new JSZip();

    for (const account of selectedAccounts) {
      const asymmetricKey = await createAsymmetricKeys(
        account.publicKey,
        account.secretKey
      );
      const file = asymmetricKey.secretKey.toPem();
      zip.file(`${account.name}_secret_key.pem`, file);
    }

    await zip.generateAsync({ type: 'blob' }).then(function (content) {
      downloadFile(new Blob([content]), 'casper-wallet-secret_keys.zip');
    });

    setDownloadAccountKeysStep(DownloadAccountKeysSteps.Success);
  };

  const content = {
    [DownloadAccountKeysSteps.Instruction]: <Instruction />,
    [DownloadAccountKeysSteps.Download]: (
      <Download
        selectedAccounts={selectedAccounts}
        setSelectedAccounts={setSelectedAccounts}
      />
    ),
    [DownloadAccountKeysSteps.Success]: <Success />
  };

  const headerButton = {
    [DownloadAccountKeysSteps.Instruction]: (
      <HeaderSubmenuBarNavLink linkType="back" />
    ),
    [DownloadAccountKeysSteps.Download]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() =>
          setDownloadAccountKeysStep(DownloadAccountKeysSteps.Instruction)
        }
      />
    ),
    [DownloadAccountKeysSteps.Success]: (
      <HeaderSubmenuBarNavLink linkType="close" />
    )
  };

  const footerButton = {
    [DownloadAccountKeysSteps.Instruction]: (
      <Button
        onClick={() =>
          setDownloadAccountKeysStep(DownloadAccountKeysSteps.Download)
        }
      >
        <Trans t={t}>Next</Trans>
      </Button>
    ),
    [DownloadAccountKeysSteps.Download]: (
      <Button onClick={downloadKeys} disabled={!selectedAccounts.length}>
        <Trans t={t}>Download account keys</Trans>
      </Button>
    ),
    [DownloadAccountKeysSteps.Success]: (
      <Button onClick={() => navigate(RouterPath.Home)}>
        <Trans t={t}>Done</Trans>
      </Button>
    )
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => headerButton[downloadAccountKeysStep]}
        />
      )}
      renderContent={() => content[downloadAccountKeysStep]}
      renderFooter={() => (
        <FooterButtonsContainer>
          {footerButton[downloadAccountKeysStep]}
        </FooterButtonsContainer>
      )}
    />
  );
};
