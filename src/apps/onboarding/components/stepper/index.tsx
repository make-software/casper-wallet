import React from 'react';
import styled from 'styled-components';

import { FlexRow, SpacingSize } from '@libs/layout';

const StepperContainer = styled(FlexRow)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

interface StepProps {
  isActiveStep: boolean;
}

const Step = styled.div<StepProps>`
  width: 8px;
  height: 8px;

  background-color: ${({ theme, isActiveStep }) =>
    isActiveStep ? theme.color.fillRed : theme.color.fillSecondary};

  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

function createStepsArray(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

interface StepperProps {
  length: number;
  activeIndex: number;
}

export function Stepper({ length, activeIndex }: StepperProps) {
  return (
    <StepperContainer gap={SpacingSize.ExtraLarge}>
      {createStepsArray(length).map(stepNumber => (
        <Step key={stepNumber} isActiveStep={stepNumber === activeIndex} />
      ))}
    </StepperContainer>
  );
}
