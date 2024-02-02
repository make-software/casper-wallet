import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { createOpenWindow } from '@background/create-open-window';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  windowIdChanged,
  windowIdCleared
} from '@background/redux/windowManagement/actions';
import { selectWindowId } from '@background/redux/windowManagement/selectors';

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
