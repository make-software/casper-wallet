import React from 'react';

import { ErrorMessages } from '@src/constants';

import { closeCurrentWindow } from '@background/close-current-window';
import {
  parseRequestTabId,
  sendSdkResponseToSpecificTab
} from '@background/send-sdk-response-to-specific-tab';

import { sdkMethod } from '@content/sdk-method';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  LayoutWindow
} from '@libs/layout';

import { SwitchAccountContent } from './content';

export function SwitchAccountPage() {
  const searchParams = new URLSearchParams(document.location.search);
  const requestId = searchParams.get('requestId');
  const requestTabId = parseRequestTabId(searchParams);

  if (!requestId || requestTabId == null) {
    throw Error(
      `${ErrorMessages.common.MISSING_SEARCH_PARAM.description} ${requestId}`
    );
  }

  const handleCancel = async () => {
    await sendSdkResponseToSpecificTab(
      sdkMethod.switchAccountResponse(false, { requestId }),
      requestTabId
    );
    closeCurrentWindow();
  };

  return (
    <LayoutWindow
      renderHeader={() => (
        <HeaderPopup
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType="cancelWindow"
              onClick={handleCancel}
            />
          )}
        />
      )}
      renderContent={() => (
        <SwitchAccountContent
          requestId={requestId}
          requestTabId={requestTabId}
        />
      )}
    />
  );
}
