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
  cleanupTimeout?: number;
}

export function CopyToClipboard({
  renderContent,
  valueToCopy,
  cleanupTimeout
}: CopyToClipboardProps) {
  const overlayTimeout = 2000;
  const [isClicked, setIsClicked] = useState(false);

  const handleCopyOnClick = useCallback(() => {
    setIsClicked(true);
    navigator.clipboard.writeText(valueToCopy);
  }, [valueToCopy]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isClicked) {
      timeout = setTimeout(() => {
        setIsClicked(false);
      }, overlayTimeout);
    }

    return () => timeout && clearTimeout(timeout);
  }, [isClicked, setIsClicked, overlayTimeout]);

  return (
    <Container onClick={isClicked ? undefined : handleCopyOnClick}>
      {renderContent({ isClicked })}
    </Container>
  );
}
