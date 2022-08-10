import { useEffect, useState } from 'react';
import { fetchActiveSiteOrigin } from '@content/remote-actions';

interface UseActiveTabOriginProps {
  currentWindow: boolean;
}

export function useActiveTabOrigin({ currentWindow }: UseActiveTabOriginProps) {
  const [activeTabOrigin, setActiveTabOrigin] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveSiteOrigin(currentWindow).then(origin => {
      setActiveTabOrigin(origin);
    });
  }, [currentWindow]);

  return activeTabOrigin;
}
