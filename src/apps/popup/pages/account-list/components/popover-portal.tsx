import { PropsWithChildren, forwardRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

const popoverRootId = 'popover-root';
const mountNode = document.querySelector(`#${popoverRootId}`);

export const PopoverPortal = forwardRef<HTMLDivElement, PropsWithChildren<{}>>(
  function PopoverPortal({ children }, ref) {
    return useMemo(
      () => (mountNode != null ? createPortal(children, mountNode) : null),
      [children]
    );
  }
);
