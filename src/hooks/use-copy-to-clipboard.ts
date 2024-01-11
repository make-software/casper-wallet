import { useCallback, useEffect, useState } from 'react';

export const useCopyToClipboard = (valueToCopy: string) => {
  const overlayTimeout = 2000;
  const [isClicked, setIsClicked] = useState(false);

  const handleCopyOnClick = useCallback(
    async event => {
      event.stopPropagation();

      if (isClicked) {
        return;
      }

      setIsClicked(true);
      await navigator.clipboard.writeText(valueToCopy);
    },
    [isClicked, valueToCopy]
  );

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isClicked) {
      timeout = setTimeout(() => {
        setIsClicked(false);
      }, overlayTimeout);
    }

    return () => timeout && clearTimeout(timeout);
  }, [isClicked, setIsClicked]);

  return {
    isClicked,
    handleCopyOnClick
  };
};
