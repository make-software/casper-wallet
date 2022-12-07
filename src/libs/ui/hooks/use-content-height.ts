import { useEffect, useRef, useState } from 'react';

export const useContentHeight = () => {
  const [headerHeight, setHeaderHeight] = useState<number | undefined>(0);
  const [footerHeight, setFooterHeight] = useState<number | undefined>(0);

  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // useEffect without dependency array because we need to check height on each render. `if` helps prevent infinity state updates
  useEffect(() => {
    if (headerRef.current?.offsetHeight !== headerHeight) {
      setHeaderHeight(headerRef.current?.offsetHeight || 0);
    }

    if (footerRef.current?.offsetHeight !== footerHeight) {
      setFooterHeight(footerRef.current?.offsetHeight || 0);
    }
  });

  return {
    headerHeight,
    footerHeight,
    headerRef,
    footerRef
  };
};
