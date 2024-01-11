import { useState } from 'react';

import { SecretPhrase } from '@libs/crypto';

export interface FormState {
  secretPhrase: SecretPhrase | null;
}

export type SetFormState = (name: keyof FormState, value: any) => void;
export const useOnboardingFormState = () => {
  const [onboardingFormState, setOnboardingFormState] = useState<FormState>({
    secretPhrase: null
  });

  const setFormState: SetFormState = (name, value) =>
    setOnboardingFormState(prevOnboardingFormState => ({
      ...prevOnboardingFormState,
      [name]: value
    }));

  return {
    onboardingFormState,
    setFormState
  };
};
