import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectWindowId } from '@popup/redux/windowManagement/selectors';
import {
  windowIdCleared,
  windowIdChanged
} from '@popup/redux/windowManagement/actions';

import { createOpenWindow } from '@src/hooks';
import { dispatchToMainStore } from '@src/apps/popup/redux/utils';

export function useWindowManager() {
  const windowId = useSelector(selectWindowId);

  const openWindow = useMemo(
    () =>
      createOpenWindow({
        windowId,
        setWindowId: (id: number) => dispatchToMainStore(windowIdChanged(id)),
        clearWindowId: () => dispatchToMainStore(windowIdCleared())
      }),
    [windowId]
  );

  return { openWindow };
}
