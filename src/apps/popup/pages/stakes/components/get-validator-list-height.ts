export const ROW_HEIGHT_PX = 80;
const MAX_VISIBLE_ROWS = 3;

export const getValidatorListHeight = (validatorCount: number): number =>
  Math.min(MAX_VISIBLE_ROWS * ROW_HEIGHT_PX, validatorCount * ROW_HEIGHT_PX);
