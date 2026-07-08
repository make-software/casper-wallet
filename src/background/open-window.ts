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
  })(openWindowProps).catch(error => {
    // Fire-and-forget: if `windows.create` rejects, surface it instead of an
    // unhandled rejection. The slice's window id is left cleared (no id was set).
    console.error('openWindow: failed to open approval window', error);
  });
}
