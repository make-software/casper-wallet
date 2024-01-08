import { useCallback, useEffect } from 'react';
import { getType, isActionOf } from 'typesafe-actions';
import browser from 'webextension-polyfill';

import {
  BackgroundEvent,
  backgroundEvent
} from '@background/background-events';
import { rootAction } from '@background/redux';
import { PopupState } from '@background/redux/utils';

type Props = {
  windowInitAction: (typeof rootAction)['windowManagement'][keyof (typeof rootAction)['windowManagement']];
  setPopupState: React.Dispatch<React.SetStateAction<PopupState | null>>;
};

export const useSubscribeToRedux = ({
  windowInitAction,
  setPopupState
}: Props) => {
  const handleStateUpdate = useCallback(
    (message: BackgroundEvent) => {
      if (isActionOf(backgroundEvent.popupStateUpdated)(message)) {
        setPopupState(message.payload);
      }
    },
    [setPopupState]
  );

  useEffect(() => {
    if (!browser.runtime.onMessage.hasListener(handleStateUpdate)) {
      browser.runtime.onMessage.addListener(handleStateUpdate);
    }

    browser.runtime.sendMessage((windowInitAction as any)()).catch(() => {
      console.error('window init: ' + getType(windowInitAction));
    });

    return () => {
      browser.runtime.onMessage.removeListener(handleStateUpdate);
    };
  }, [handleStateUpdate, windowInitAction]);
};
