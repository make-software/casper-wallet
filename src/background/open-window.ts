import {
  OpenWindowProps,
  createOpenWindow
} from '@background/create-open-window';
import { MainStore } from '@background/redux/get-main-store';
import {
  windowIdChanged,
  windowIdCleared
} from '@background/redux/windowManagement/actions';
import { selectWindowId } from '@background/redux/windowManagement/selectors';

export function openWindow(store: MainStore, openWindowProps: OpenWindowProps) {
  createOpenWindow({
    windowId: selectWindowId(store.getState()),
    setWindowId: (id: number) => store.dispatch(windowIdChanged(id)),
    clearWindowId: () => store.dispatch(windowIdCleared())
  })(openWindowProps);
}
