import React from 'react';
import styled from 'styled-components';

import { Spinner } from '@libs/ui/components';

const Container = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
`;

/**
 * The popup's frame while it has nothing to draw yet. The icon opens this document straight
 * from the manifest's `default_popup`, so the window is on screen for a storage round-trip
 * before the background replica reaches it.
 */
export const PopupLoadingView = () => (
  <Container>
    <Spinner style={{ marginTop: 0 }} />
  </Container>
);
