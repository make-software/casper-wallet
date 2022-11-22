interface Props {
  isValid?: boolean;
  isDirty?: boolean;
  isSubmitting?: boolean;
}

export function calculateSubmitButtonDisabled({
  isValid,
  isDirty,
  isSubmitting
}: Props) {
  if (isDirty != null && isValid != null) {
    return !isValid || !isDirty || isSubmitting;
  }

  if (isDirty != null) {
    return !isDirty || isSubmitting;
  }

  if (isValid != null) {
    return !isValid || isSubmitting;
  }

  return false;
}
