import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { dispatchToMainStore } from '@src/background/redux/utils';
import {
  windowIdChanged,
  windowIdCleared
} from '@src/background/redux/windowManagement/actions';
import { selectWindowId } from '@src/background/redux/windowManagement/selectors';
import { createOpenWindow } from '@src/hooks';

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
