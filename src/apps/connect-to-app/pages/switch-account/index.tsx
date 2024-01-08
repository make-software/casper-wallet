import React from 'react';

import { closeCurrentWindow } from '@background/close-current-window';
import { sendSdkResponseToSpecificTab } from '@background/send-sdk-response-to-specific-tab';

import { sdkMethod } from '@content/sdk-method';

import {
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  PopupHeader
} from '@libs/layout';

import { SwitchAccountContent } from './content';

export function SwitchAccountPage() {
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
      renderContent={() => <SwitchAccountContent requestId={requestId} />}
    />
  );
}
