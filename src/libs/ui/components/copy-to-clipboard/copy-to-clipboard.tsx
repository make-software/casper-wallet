import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  cursor: ${({ onClick }) => (onClick != null ? 'pointer' : 'auto')};
`;

function clearClipboardAfterMinute() {
  // It won't work if user change a focus to other window
  // TODO: improve solution
  const cleanupTimeout = 1000 * 60; // 1 minute

  setTimeout(async () => {
    await navigator.clipboard.writeText('');
  }, cleanupTimeout);
}

interface RenderContentProps {
  isClicked: boolean;
}

interface CopyToClipboardProps {
  renderContent: (renderContentProps: RenderContentProps) => JSX.Element;
  valueToCopy: string;
  automaticallyClearClipboard?: boolean;
}

export function CopyToClipboard({
  renderContent,
  valueToCopy,
  automaticallyClearClipboard
}: CopyToClipboardProps) {
  const overlayTimeout = 2000;
  const [isClicked, setIsClicked] = useState(false);

  const handleCopyOnClick = useCallback(async () => {
    if (isClicked) {
      return;
    }

    setIsClicked(true);
    await navigator.clipboard.writeText(valueToCopy);

    if (automaticallyClearClipboard) {
      clearClipboardAfterMinute();
    }
  }, [isClicked, valueToCopy, automaticallyClearClipboard]);

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
