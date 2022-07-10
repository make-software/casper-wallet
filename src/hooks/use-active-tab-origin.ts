import { useEffect, useState } from 'react';
import { getActiveTabOrigin } from '@content/remote-actions';

interface UseActiveTabOriginProps {
  currentWindow: boolean;
}

export function useActiveTabOrigin({ currentWindow }: UseActiveTabOriginProps) {
  const [activeTabOrigin, setActiveTabOrigin] = useState('');

  useEffect(() => {
    async function getActiveTabOriginAndSaveToState() {
      const origin = await getActiveTabOrigin(currentWindow);
      setActiveTabOrigin(origin);
    }
    getActiveTabOriginAndSaveToState().catch(e => console.error(e));
  }, [currentWindow]);

  return activeTabOrigin;
}
