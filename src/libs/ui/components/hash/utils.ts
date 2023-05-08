export function truncateKey(
  key: string,
  options: { size?: 'small' | 'max' } = {}
): string {
  let beginOfKey, endOfKey;
  switch (options.size) {
    case 'small':
    default:
      beginOfKey = key.slice(0, 5);
      endOfKey = key.slice(key.length - 5);
      break;

    case 'max':
      beginOfKey = key.slice(0, 13);
      endOfKey = key.slice(key.length - 13);
      break;
  }

  return `${beginOfKey}...${endOfKey}`;
}

export const isValidHash = (hash?: string | null): hash is string => {
  if (hash == null) {
    return false;
  }
  const validHashRegExp = new RegExp('^([0-9A-Fa-f]){64}$');
  return validHashRegExp.test(hash.trim());
};
