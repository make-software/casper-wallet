import React, { useState } from 'react';
import styled from 'styled-components';
import { BaseProps } from '../../types';
import { useClickAway } from '../../hooks/use-click-away';

export interface AccordionProps extends BaseProps {
  backgroundColor?: string;
  children: (renderProps: RenderProps) => React.ReactNode | string;
  renderContent: (renderProps: RenderProps) => React.ReactNode | string;
  disableClickAway?: boolean;
}

interface RenderProps {
  isOpen: boolean;
}

const AccordionContainer = styled.div<{
  isOpen: boolean;
  backgroundColor?: string;
}>(({ isOpen, backgroundColor = 'transparent' }) => ({
  display: 'flex',
  flexDirection: 'column',

  background: isOpen ? backgroundColor : 'transparent',
  width: '100%'
}));

const StyledContainer = styled.div(() => ({
  cursor: 'pointer'
}));

export function Accordion({
  children,
  renderContent,
  disableClickAway,
  ...props
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { ref } = useClickAway({
    callback: () => {
      !disableClickAway && setIsOpen(false);
    }
  });

  const renderProps: RenderProps = { isOpen };

  return (
    <AccordionContainer isOpen={isOpen} {...props}>
      <StyledContainer
        ref={ref}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        {children(renderProps)}
      </StyledContainer>
      {isOpen && renderContent(renderProps)}
    </AccordionContainer>
  );
}

export default Accordion;
