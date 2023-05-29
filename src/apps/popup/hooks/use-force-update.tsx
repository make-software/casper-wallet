import { useCallback, useState } from 'react';

export function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  const forceUpdate = useCallback(() => {
    setValue(value => value + 1); // update state to force rerender
    // will reload forceUpdate so can be used as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return forceUpdate;
}
