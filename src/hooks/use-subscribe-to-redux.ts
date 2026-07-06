import React, { useCallback, useEffect } from 'react';
import { getType, isActionOf } from 'typesafe-actions';
import { runtime } from 'webextension-polyfill';

import {
  BackgroundEvent,
  backgroundEvent
} from '@background/background-events';
import { rootAction } from '@background/redux';
import { PopupState } from '@background/redux/types';

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
      if (isActionOf(backgroundEvent.popupStateUpdated)(event)) {
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
      console.error('window init: ' + getType(windowInitAction));
    });

    return () => {
      runtime.onMessage.removeListener(handleStateUpdate);
    };
  }, [handleStateUpdate, windowInitAction]);
};
