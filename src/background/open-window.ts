// TODO: Remake it after background store will be complete
import { createOpenWindow, OpenWindowProps } from './create-open-window';

let windowId: number | null = null;

export function openWindow(openWindowProps: OpenWindowProps) {
  createOpenWindow({
    windowId,
    setWindowId: (id: number) => (windowId = id),
    clearWindowId: () => (windowId = null)
  })(openWindowProps);
}
