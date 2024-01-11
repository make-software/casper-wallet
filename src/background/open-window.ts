// TODO: Remake it after background store will be complete
import {
  OpenWindowProps,
  createOpenWindow
} from '@background/create-open-window';

let windowId: number | null = null;

export function openWindow(openWindowProps: OpenWindowProps) {
  createOpenWindow({
    windowId,
    setWindowId: (id: number) => (windowId = id),
    clearWindowId: () => (windowId = null)
  })(openWindowProps);
}
