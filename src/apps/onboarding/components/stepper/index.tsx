import React from 'react';
import styled from 'styled-components';

import { FlexRow } from '@libs/layout';

const StepperContainer = styled(FlexRow)`
  gap: 16px;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

interface StepProps {
  isCurrentStep: boolean;
}

const Step = styled.div<StepProps>`
  width: 8px;
  height: 8px;

  background-color: ${({ theme, isCurrentStep }) =>
    isCurrentStep ? theme.color.fillRed : theme.color.fillSecondary};

  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

function createStepsArray(countOfSteps: number): number[] {
  return Array.from({ length: countOfSteps }, (_, index) => index + 1);
}

interface StepperProps {
  steps: number;
  step: number;
}

export function Stepper({ steps, step }: StepperProps) {
  return (
    <StepperContainer>
      {createStepsArray(steps).map(stepNumber => (
        <Step key={stepNumber} isCurrentStep={stepNumber === step} />
      ))}
    </StepperContainer>
  );
}
