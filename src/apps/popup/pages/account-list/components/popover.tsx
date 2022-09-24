import React, { useState, MouseEvent } from 'react';
import styled from 'styled-components';

import { SvgIcon } from '@libs/ui';
import { CenteredFlexRow, FlexColumn } from '@libs/layout';

import { useClickAway } from '@libs/ui/hooks/use-click-away';

import { PopoverPortal } from './popover-portal';

const PopoverContainer = styled(CenteredFlexRow)`
  padding: 14px 18px;
  cursor: pointer;
`;

const PopoverItemsContainer = styled(FlexColumn)`
  gap: 12px;

  padding: 16px 20px;

  background: ${({ theme }) => theme.color.fillWhite};
  box-shadow: 0 1px 8px rgba(132, 134, 140, 0.2);
  border-radius: 8px;
`;

type RenderProps = {
  closePopover: (e: MouseEvent<HTMLDivElement>) => void;
};

interface PopoverProps {
  renderMenuItems: (renderProps: RenderProps) => JSX.Element;
}

export function Popover({ renderMenuItems }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { ref } = useClickAway({
    callback: () => setIsOpen(false)
  });

  const closePopover = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <PopoverContainer ref={ref}>
      {isOpen && (
        <PopoverPortal top={ref.current?.getBoundingClientRect().top}>
          <PopoverItemsContainer>
            {renderMenuItems({ closePopover })}
          </PopoverItemsContainer>
        </PopoverPortal>
      )}
      <SvgIcon
        src="assets/icons/more.svg"
        size={24}
        onClick={e => setIsOpen(true)}
      />
    </PopoverContainer>
  );
}
