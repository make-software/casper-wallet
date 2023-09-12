import React from 'react';
import styled from 'styled-components';

import { useCopyToClipboard } from '@src/hooks';

const Container = styled.div`
  cursor: ${({ onClick }) => (onClick != null ? 'pointer' : 'auto')};
`;

interface RenderContentProps {
  isClicked: boolean;
}

interface CopyToClipboardProps {
  renderContent: (renderContentProps: RenderContentProps) => JSX.Element;
  valueToCopy: string;
}

export function CopyToClipboard({
  renderContent,
  valueToCopy
}: CopyToClipboardProps) {
  const { isClicked, handleCopyOnClick } = useCopyToClipboard(valueToCopy);

  return (
    <Container onClick={isClicked ? undefined : handleCopyOnClick}>
      {renderContent({ isClicked })}
    </Container>
  );
}
