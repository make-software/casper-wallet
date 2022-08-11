import { useEffect, useState } from 'react';
import { fetchActiveTabOrigin } from '@content/remote-actions';

interface UseActiveTabOriginProps {
  currentWindow: boolean;
}

export function useActiveTabOrigin({ currentWindow }: UseActiveTabOriginProps) {
  const [activeTabOrigin, setActiveTabOrigin] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveTabOrigin(currentWindow)
      .then(origin => {
        setActiveTabOrigin(origin);
      })
      .catch(e => console.error('Communication failed: ' + e));
  }, [currentWindow]);

  return activeTabOrigin;
}
