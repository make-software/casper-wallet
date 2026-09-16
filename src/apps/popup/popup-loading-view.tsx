import React from 'react';
import styled from 'styled-components';

import { Spinner } from '@libs/ui/components';

const Container = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
`;

/** The popup's frame while the background replica is still in flight. */
export const PopupLoadingView = () => (
  <Container>
    <Spinner style={{ marginTop: 0 }} />
  </Container>
);
