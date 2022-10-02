import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const Container = styled.div``;

interface CopyToClipboardProps {
  renderClickableComponent: () => JSX.Element;
  renderStatusComponent: () => JSX.Element;
  value: string;
  overlayTimeout?: number;
  cleanupTimeout?: number;
  handlePostAction?: () => void;
}

export function CopyToClipboard({
  renderClickableComponent,
  renderStatusComponent,
  value,
  overlayTimeout = 2000,
  cleanupTimeout
}: CopyToClipboardProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleCopyOnClick = useCallback(() => {
    if (isClicked) {
      return;
    }

    setIsClicked(true);
    navigator.clipboard.writeText(value);
  }, [isClicked, value]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isClicked) {
      timeout = setTimeout(() => {
        setIsClicked(false);
      }, overlayTimeout);
    }

    return () => timeout && clearTimeout(timeout);
  }, [isClicked, setIsClicked, overlayTimeout]);

  if (isClicked) {
    return renderStatusComponent();
  }

  return (
    <Container onClick={handleCopyOnClick}>
      {renderClickableComponent()}
    </Container>
  );
}
