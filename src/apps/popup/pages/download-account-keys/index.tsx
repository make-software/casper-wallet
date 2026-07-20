import JSZip from 'jszip';
import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PasswordProtectionPage } from '@popup/pages/password-protection-page';

import { closeExportKeysSurface } from '@background/open-export-keys-surface';

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

  const setPasswordConfirmed = useCallback(() => {
    setIsPasswordConfirmed(true);
  }, []);

  if (!isPasswordConfirmed) {
    return (
      <PasswordProtectionPage
        setPasswordConfirmed={setPasswordConfirmed}
        onCloseWindow={() => closeExportKeysSurface()}
      />
    );
  }

  const downloadKeys = async () => {
    try {
      const zip = new JSZip();

      for (const account of selectedAccounts) {
        const asymmetricKey = createAsymmetricKeys(
          account.publicKey,
          account.secretKey
        );

        if (asymmetricKey.secretKey) {
          const file = asymmetricKey.secretKey.toPem();
          zip.file(`${account.name}_secret_key.pem`, file);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      downloadFile(new Blob([content]), 'casper-wallet-secret_keys.zip');

      setDownloadAccountKeysStep(DownloadAccountKeysSteps.Success);
    } catch (error) {
      // Stay on this step: advancing to Success here is exactly the false
      // "your keys were saved" this ticket exists to remove. Only the error
      // name is logged — the thrown value is built from key material and must
      // not reach the console.
      console.error(
        'downloadKeys: failed to build or download the keys archive',
        error instanceof Error ? error.name : 'unknown error'
      );
    }
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
    // "Back" is only used where it genuinely steps back inside the flow. The
    // entry step has nowhere to go back to in a dedicated window, so it closes
    // instead — labelling that "Back" would be a lie (WALLET-1345).
    [DownloadAccountKeysSteps.Instruction]: (
      <HeaderSubmenuBarNavLink
        linkType="close"
        onClick={() => closeExportKeysSurface()}
      />
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
      <HeaderSubmenuBarNavLink
        linkType="close"
        onClick={() => closeExportKeysSurface()}
      />
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
      <>
        <Button onClick={() => closeExportKeysSurface()}>
          <Trans t={t}>Done</Trans>
        </Button>
        <Button color="secondaryBlue" onClick={downloadKeys}>
          <Trans t={t}>Download again</Trans>
        </Button>
      </>
    )
  };

  return (
    <PopupLayout
      renderHeader={() => (
        // Deliberately bare: this window exists to export secret keys and
        // nothing else. The wallet menu / network switcher / connection status
        // would let the user navigate the full wallet inside a 376px export
        // window and strand themselves there (WALLET-1345).
        <HeaderPopup
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
