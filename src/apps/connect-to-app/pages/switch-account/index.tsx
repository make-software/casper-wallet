import React from 'react';

import {
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  PopupHeader
} from '@src/libs/layout';

import { SwitchAccountContent } from './content';
import { sendSdkResponseToSpecificTab } from '@src/background/send-sdk-response-to-specific-tab';
import { sdkMethod } from '@src/content/sdk-method';
import { closeCurrentWindow } from '@src/background/close-current-window';

interface SwitchAccountPageProps {
  siteTitle: string;
}

export function SwitchAccountPage({ siteTitle }: SwitchAccountPageProps) {
  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    const error = Error(`Missing search param: ${requestId}`);
    throw error;
  }

  const handleCancel = async () => {
    await sendSdkResponseToSpecificTab(
      sdkMethod.connectResponse(false, { requestId })
    );
    closeCurrentWindow();
  };

  return (
    <LayoutWindow
      renderHeader={() => (
        <PopupHeader
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType="cancelWindow"
              onClick={handleCancel}
            />
          )}
        />
      )}
      renderContent={() => (
        <SwitchAccountContent requestId={requestId} siteTitle={siteTitle} />
      )}
    />
  );
}
