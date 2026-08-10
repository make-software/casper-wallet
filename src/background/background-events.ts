import { createAction } from '@reduxjs/toolkit';

import { PopupState } from './redux/types';

// General purpose events emitted by background to all extension windows

export const backgroundEvent = {
  popupStateUpdated: createAction<PopupState>('popupStateUpdated'),
  // Payload-free by design (P0.1): tells UI replicas to re-fetch private
  // state via fetchPrivateState() instead of carrying secret material.
  privateStateUpdated: createAction('privateStateUpdated')
};

export type BackgroundEvent = ReturnType<
  (typeof backgroundEvent)[keyof typeof backgroundEvent]
>;
