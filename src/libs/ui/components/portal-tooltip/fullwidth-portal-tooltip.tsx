import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const PortalTooltipRoot = styled.div<{ top: number }>(({ theme, top }) => ({
  position: 'fixed',
  top,
  left: 8,
  maxWidth: 360,
  zIndex: 9999,
  pointerEvents: 'auto',

  padding: '8px 16px',

  backgroundColor: `${theme.color.backgroundPrimary}`,
  borderRadius: `${theme.borderRadius.twelve}px`,
  boxShadow: `${theme.shadow.tooltip}`,

  cursor: 'default'
}));

interface FullWidthPortalTooltipProps {
  children: React.ReactNode;
  title: React.ReactNode;
  open: boolean;
}

export const FullWidthPortalTooltip: React.FC<FullWidthPortalTooltipProps> = ({
  children,
  title,
  open
}) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open && anchorRef.current) {
      setRect(anchorRef.current.getBoundingClientRect());
    }
  }, [open]);

  return (
    <>
      <div ref={anchorRef} style={{ display: 'block', width: '100%' }}>
        {children}
      </div>
      {open &&
        rect &&
        createPortal(
          <PortalTooltipRoot top={rect.bottom + window.scrollY}>
            {title}
          </PortalTooltipRoot>,
          document.body
        )}
    </>
  );
};
