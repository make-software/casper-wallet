import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createOpenWindow } from '~src/background/create-open-window';
import { dispatchToMainStore } from '~src/libs/redux/utils';
import {
  windowIdChanged,
  windowIdCleared
} from '~src/libs/redux/windowManagement/actions';
import { selectWindowId } from '~src/libs/redux/windowManagement/selectors';

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
