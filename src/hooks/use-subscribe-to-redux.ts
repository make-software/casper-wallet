import React, { useCallback, useEffect } from 'react';
import { runtime } from 'webextension-polyfill';

import {
  BackgroundEvent,
  backgroundEvent
} from '@background/background-events';
import { rootAction } from '@background/redux';
import { PopupState } from '@background/redux/popup-state';

type Props = {
  windowInitAction: (typeof rootAction)['windowManagement'][keyof (typeof rootAction)['windowManagement']];
  setPopupState: React.Dispatch<React.SetStateAction<PopupState | null>>;
};

export const useSubscribeToRedux = ({
  windowInitAction,
  setPopupState
}: Props) => {
  const handleStateUpdate = useCallback(
    (message: unknown) => {
      const event = message as BackgroundEvent;
      if (backgroundEvent.popupStateUpdated.match(event)) {
        setPopupState(event.payload);
      }
    },
    [setPopupState]
  );

  useEffect(() => {
    if (!runtime.onMessage.hasListener(handleStateUpdate)) {
      runtime.onMessage.addListener(handleStateUpdate);
    }

    runtime.sendMessage((windowInitAction as any)()).catch(() => {
      console.error('window init: ' + String(windowInitAction));
    });

    return () => {
      runtime.onMessage.removeListener(handleStateUpdate);
    };
  }, [handleStateUpdate, windowInitAction]);
};
