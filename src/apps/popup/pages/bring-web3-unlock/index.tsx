import React from 'react';

import { closeCurrentWindow } from '@background/close-current-window';

// we use this for closing the window after the user unlocks the wallet for bringweb3 cashback
export const BringWeb3Unlock: React.FC = () => {
  closeCurrentWindow();

  return null;
};
