interface GetSubmitButtonStateFromValidationProps {
  isValid?: boolean;
  isDirty?: boolean;
}

export function getSubmitButtonStateFromValidation({
  isValid,
  isDirty
}: GetSubmitButtonStateFromValidationProps) {
  let isSubmitButtonDisabled = true;

  if (isDirty != null) {
    isSubmitButtonDisabled = !isDirty;
  }

  if (isValid != null) {
    isSubmitButtonDisabled = !isValid;
  }

  return isSubmitButtonDisabled;
}
