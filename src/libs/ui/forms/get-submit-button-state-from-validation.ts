interface GetSubmitButtonStateFromValidationProps {
  isValid?: boolean;
  isDirty?: boolean;
}

export function getSubmitButtonStateFromValidation({
  isValid,
  isDirty
}: GetSubmitButtonStateFromValidationProps) {
  if (isDirty != null && isValid != null) {
    return !isValid || !isDirty;
  }

  if (isDirty != null) {
    return !isDirty;
  }

  if (isValid != null) {
    return !isValid;
  }

  return false;
}
