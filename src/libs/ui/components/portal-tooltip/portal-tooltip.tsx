import React, { PropsWithChildren, useCallback, useState } from 'react';
import styled from 'styled-components';

import { FullWidthPortalTooltip } from './fullwidth-portal-tooltip';

interface TooltipProps extends PropsWithChildren {
  title: JSX.Element | null;
}

const ChildrenContainer = styled.div`
  cursor: pointer;
`;

export const PortalTooltip: React.FC<TooltipProps> = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  const onMouseEnter = useCallback(() => {
    setOpen(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setOpen(false);
  }, []);

  if (!title) {
    return <>{children}</>;
  }

  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <FullWidthPortalTooltip open={open} title={title}>
        <ChildrenContainer>{children}</ChildrenContainer>
      </FullWidthPortalTooltip>
    </div>
  );
};
