import { ChangeEvent, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  swapDeadlineSettingChanged,
  swapSlippageSettingChanged
} from '@background/redux/settings/actions';
import {
  selectSwapDeadlineSetting,
  selectSwapSlippageSetting
} from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  isHighSlippage,
  parseDeadlineInput,
  parseSlippageInput,
  sanitizeDecimalInput,
  sanitizeIntegerInput
} from './parse-settings-input';

export interface UseSwapSettingsFormReturn {
  slippageInput: string;
  deadlineInput: string;
  showHighSlippageWarning: boolean;
  handleSlippageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDeadlineChange: (event: ChangeEvent<HTMLInputElement>) => void;
  commit: () => void;
}

export const useSwapSettingsForm = (): UseSwapSettingsFormReturn => {
  const slippage = useSelector(selectSwapSlippageSetting);
  const deadline = useSelector(selectSwapDeadlineSetting);

  // Seeded once: <Modal> unmounts its content while closed, so every open starts from
  // the stored values and Cancel needs no rollback.
  const [slippageInput, setSlippageInput] = useState(() => String(slippage));
  const [deadlineInput, setDeadlineInput] = useState(() => String(deadline));

  const handleSlippageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setSlippageInput(sanitizeDecimalInput(event.target.value)),
    []
  );

  const handleDeadlineChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setDeadlineInput(sanitizeIntegerInput(event.target.value)),
    []
  );

  // The reducer is the clamping site, so an out-of-range or empty field is dispatched
  // as-is and comes back clamped on the next read.
  const commit = useCallback(() => {
    dispatchToMainStore(
      swapSlippageSettingChanged(parseSlippageInput(slippageInput))
    );
    dispatchToMainStore(
      swapDeadlineSettingChanged(parseDeadlineInput(deadlineInput))
    );
  }, [deadlineInput, slippageInput]);

  return {
    slippageInput,
    deadlineInput,
    showHighSlippageWarning: isHighSlippage(slippageInput),
    handleSlippageChange,
    handleDeadlineChange,
    commit
  };
};
