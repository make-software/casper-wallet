import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

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
  const overlayTimeout = 2000;
  const [isClicked, setIsClicked] = useState(false);

  const handleCopyOnClick = useCallback(async () => {
    if (isClicked) {
      return;
    }

    setIsClicked(true);
    await navigator.clipboard.writeText(valueToCopy);
  }, [isClicked, valueToCopy]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isClicked) {
      timeout = setTimeout(() => {
        setIsClicked(false);
      }, overlayTimeout);
    }

    return () => timeout && clearTimeout(timeout);
  }, [isClicked, setIsClicked]);

  return (
    <Container onClick={isClicked ? undefined : handleCopyOnClick}>
      {renderContent({ isClicked })}
    </Container>
  );
}
