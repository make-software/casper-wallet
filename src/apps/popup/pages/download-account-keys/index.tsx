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
import { Failure } from './failure';
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
      // Only the error name is logged — the thrown value is built from key
      // material and must not reach the console. Nothing collects these logs
      // (the project has no Sentry or equivalent), so the Failure step below is
      // the only way this reaches anyone.
      console.error(
        'downloadKeys: failed to build or download the keys archive',
        error instanceof Error ? error.name : 'unknown error'
      );
      setDownloadAccountKeysStep(DownloadAccountKeysSteps.Failure);
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
    [DownloadAccountKeysSteps.Success]: <Success />,
    [DownloadAccountKeysSteps.Failure]: <Failure />
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
    ),
    [DownloadAccountKeysSteps.Failure]: (
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
    ),
    // Back to account selection rather than retrying blind: the selection is
    // still in state, so the user can confirm or change it before trying again.
    [DownloadAccountKeysSteps.Failure]: (
      <Button
        onClick={() =>
          setDownloadAccountKeysStep(DownloadAccountKeysSteps.Download)
        }
      >
        <Trans t={t}>Try again</Trans>
      </Button>
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
