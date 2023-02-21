import { useCallback, useEffect, useRef } from 'react';

export type Props = {
  eventType?: 'click';
  callback: (event: any) => void;
};

export function useClickAway({ eventType = 'click', callback }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (event: any) => {
      if (ref && ref.current) {
        if (!ref.current.contains(event.target)) {
          callback(event);
        }
      }
    },
    [callback, ref]
  );

  useEffect(() => {
    document.addEventListener(eventType, handleClickOutside, true);
    return () => {
      document.removeEventListener(eventType, handleClickOutside, true);
    };
  }, [eventType, handleClickOutside]);

  return { ref };
}
