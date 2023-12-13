export const getLinearGradientColor = (
  gradientColor:
    | {
        deg: string;
        from: string;
        to: string;
      }
    | string
) => {
  if (typeof gradientColor === 'string') return gradientColor;

  return `linear-gradient(${gradientColor.deg}, ${gradientColor.from}, ${gradientColor.to})`;
};
