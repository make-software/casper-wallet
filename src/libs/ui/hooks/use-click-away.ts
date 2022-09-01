import { useCallback, useEffect, useRef } from 'react';

export type Props = {
  eventType?: 'click';
  callback: () => void;
};

export function useClickAway({ eventType = 'click', callback }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (event: any) => {
      if (ref && ref.current) {
        if (!ref.current.contains(event.target)) {
          callback();
        }
      }
    },
    [callback, ref]
  );

  useEffect(() => {
    document.addEventListener(eventType, handleClickOutside);
    return () => {
      document.removeEventListener(eventType, handleClickOutside, false);
    };
  }, [eventType, handleClickOutside]);

  return { ref };
}
