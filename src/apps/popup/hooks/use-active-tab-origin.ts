import { useEffect, useState } from 'react';
import { getActiveTabOrigin } from '@content/remote-actions';

export function useActiveTabOrigin() {
  const [activeTabOrigin, setActiveTabOrigin] = useState('');

  useEffect(() => {
    async function getActiveTabOriginAndSaveToState() {
      const origin = await getActiveTabOrigin();
      setActiveTabOrigin(origin);
    }
    getActiveTabOriginAndSaveToState().catch(e => console.error(e));
  }, []);

  return activeTabOrigin;
}
