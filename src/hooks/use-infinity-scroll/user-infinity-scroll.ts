import { useCallback, useEffect, useRef } from 'react';

export const useInfinityScroll = (callback: () => void) => {
  const observerElement = useRef(null);

  const handleObserver = useCallback(
    entries => {
      const [target] = entries;

      if (target.isIntersecting) {
        callback();
      }
    },
    [callback]
  );

  useEffect(() => {
    const element = observerElement.current;
    const option = { threshold: 0 };

    const observer = new IntersectionObserver(handleObserver, option);

    if (element != null) {
      observer.observe(element);
    }
    return () => {
      if (element != null) {
        return observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  return {
    observerElement
  };
};
