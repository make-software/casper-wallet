import { DeployIcon } from '@src/constants';

interface ResolveIconSrcProps {
  src?: string | null;
  fallbackSrc?: DeployIcon;
  hasError: boolean;
}

export interface ResolvedIconSrc {
  src: string;
  /** The bundled asset is inlined by SvgIcon; the remote one never is. */
  isFallback: boolean;
}

/**
 * Icon urls arrive inside API responses, so a missing url and a failed load are
 * both normal states rather than errors. Keeping the branching here — instead of
 * inside the component — is what makes it testable in the repo's DOM-less jest
 * environment.
 */
export const resolveIconSrc = ({
  src,
  fallbackSrc,
  hasError
}: ResolveIconSrcProps): ResolvedIconSrc | null => {
  if (!src || hasError) {
    return fallbackSrc == null ? null : { src: fallbackSrc, isFallback: true };
  }

  return { src, isFallback: false };
};
