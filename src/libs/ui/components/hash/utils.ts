export function truncateKey(key: string): string {
  const beginOfKey = key.slice(0, 5);
  const endOfKey = key.slice(key.length - 5);

  return `${beginOfKey}...${endOfKey}`;
}

export const isValidHash = (hash?: string | null): hash is string => {
  if (hash == null) {
    return false;
  }
  const validHashRegExp = new RegExp('^([0-9A-Fa-f]){64}$');
  return validHashRegExp.test(hash.trim());
};
