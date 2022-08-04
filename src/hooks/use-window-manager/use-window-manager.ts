import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectWindowId } from '@popup/redux/windowManagement/selectors';
import {
  clearWindowId,
  storeWindowId
} from '@popup/redux/windowManagement/actions';

import { createOpenWindow } from '@src/hooks';

export function useWindowManager() {
  const dispatch = useDispatch();
  const windowId = useSelector(selectWindowId);

  const openWindow = useMemo(
    () =>
      createOpenWindow({
        windowId,
        setWindowId: (id: number) => dispatch(storeWindowId(id)),
        clearWindowId: () => dispatch(clearWindowId())
      }),
    [dispatch, windowId]
  );

  return { openWindow };
}
