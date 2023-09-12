import { useEffect } from 'react';

/** onResult called only if mounted */
export const useAsyncEffect = <T = string>(
  func: () => Promise<T>,
  onResult: (p: T) => void,
  deps: any[]
) => {
  useEffect(() => {
    let mounted = true;

    (async () => {
      const resp = await func();

      if (mounted) {
        onResult(resp);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
