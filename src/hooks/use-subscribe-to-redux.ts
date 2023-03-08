import { useEffect } from 'react';
import { getType, isActionOf } from 'typesafe-actions';
import browser from 'webextension-polyfill';
import {
  backgroundEvent,
  BackgroundEvent
} from '@background/background-events';
import { PopupState } from '@src/background/redux/utils';
import { rootAction } from '@src/background/redux';

type Props = {
  windowInitAction: typeof rootAction['windowManagement'][keyof typeof rootAction['windowManagement']];
  setPopupState: React.Dispatch<React.SetStateAction<PopupState | null>>;
};

export const useSubscribeToRedux = ({
  windowInitAction,
  setPopupState
}: Props) => {
  function handleStateUpdate(message: BackgroundEvent) {
    if (isActionOf(backgroundEvent.popupStateUpdated)(message)) {
      setPopupState(message.payload);
    }
  }

  useEffect(() => {
    if (!browser.runtime.onMessage.hasListener(handleStateUpdate)) {
      browser.runtime.onMessage.addListener(handleStateUpdate);
    }

    browser.runtime.sendMessage((windowInitAction as any)()).catch(err => {
      console.error('window init: ' + getType(windowInitAction));
    });

    return () => {
      browser.runtime.onMessage.removeListener(handleStateUpdate);
    };
  }, []);
};
