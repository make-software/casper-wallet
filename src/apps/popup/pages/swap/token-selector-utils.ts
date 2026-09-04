import { IDexToken } from 'casper-wallet-core/src/domain/swap';

export type CustomTokenStatus =
  'idle' | 'loading' | 'error' | 'not-found' | 'whitelisted' | 'unlisted';

const CONTRACT_HASH_QUERY_REGEX = /^(hash-)?([0-9a-fA-F]{64})$/;

/** `null` when the query is not a contract package hash. Strips an optional `hash-` prefix. */
export function parseContractHashQuery(query: string): string | null {
  const match = CONTRACT_HASH_QUERY_REGEX.exec(query.trim());

  return match ? match[2] : null;
}

export function filterDexTokens(
  tokens: IDexToken[],
  query: string
): IDexToken[] {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    return tokens;
  }

  return tokens.filter(
    token =>
      token.symbol.toLowerCase().includes(trimmed) ||
      token.name.toLowerCase().includes(trimmed) ||
      token.id.toLowerCase().includes(trimmed) ||
      token.packageHash.toLowerCase().includes(trimmed)
  );
}

interface GetCustomTokenStatusParams {
  token: IDexToken | undefined;
  isLoading: boolean;
  isError: boolean;
  status: number | undefined;
}

export function getCustomTokenStatus({
  token,
  isLoading,
  isError,
  status
}: GetCustomTokenStatusParams): CustomTokenStatus {
  if (isLoading) {
    return 'loading';
  }

  if (isError) {
    return status === 404 ? 'not-found' : 'error';
  }

  if (!token) {
    return 'idle';
  }

  // A blacklisted token is deliberately reported as not-found — see the
  // Task 3 Intent for why "blacklisted" is never surfaced to the user.
  if (token.isBlacklisted) {
    return 'not-found';
  }

  if (token.isWhitelisted) {
    return 'whitelisted';
  }

  return 'unlisted';
}
