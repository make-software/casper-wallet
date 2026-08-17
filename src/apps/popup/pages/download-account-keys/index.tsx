import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PasswordProtectionPage } from '@popup/pages/password-protection-page';

import { closeExportKeysSurface } from '@background/open-export-keys-surface';

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
import { runKeysDownload } from './run-keys-download';
import { Success } from './success';
import { DownloadAccountKeysSteps } from './utils';

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

  const downloadKeys = () =>
    runKeysDownload(selectedAccounts, setDownloadAccountKeysStep);

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
