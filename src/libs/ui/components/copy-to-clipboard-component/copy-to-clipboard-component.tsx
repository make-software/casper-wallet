import React, { PropsWithChildren, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { CenteredFlexRow, SpacingSize } from '@libs/layout';
import { CopyToClipboard, Typography } from '@libs/ui/components';

interface HashContainerProps {
  withHover?: boolean;
}

const HashContainer = styled(CenteredFlexRow)<HashContainerProps>`
  ${({ withHover, theme }) =>
    withHover && ` &:hover > span { color: ${theme.color.contentAction}; }`};
`;

interface CopyToClipboardComponentProps extends PropsWithChildren {
  enabled: boolean;
  withCopyIcon: boolean;
  valueToCopy: string;
  copiedElement?: JSX.Element;
  copyElement?: JSX.Element;
  copiedElementWithChildren?: boolean;
}

export const CopyToClipboardComponent: React.FC<
  CopyToClipboardComponentProps
> = ({
  children,
  enabled,
  valueToCopy,
  withCopyIcon,
  copiedElement,
  copiedElementWithChildren,
  copyElement
}) => {
  const { t } = useTranslation();

  const renderCopied = useCallback(() => {
    if (copiedElement) {
      return copiedElementWithChildren ? (
        <HashContainer
          gap={withCopyIcon ? SpacingSize.Small : SpacingSize.Tiny}
          withHover
        >
          {children}
          {copiedElement}
        </HashContainer>
      ) : (
        copiedElement
      );
    }

    return (
      <Typography type="captionHash" color="contentPositive">
        <Trans t={t}>Copied!</Trans>
      </Typography>
    );
  }, [children, copiedElement, copiedElementWithChildren, t, withCopyIcon]);

  if (!enabled) {
    return children;
  }

  return (
    <CopyToClipboard
      renderContent={({ isClicked }) => (
        <>
          {isClicked ? (
            renderCopied()
          ) : (
            <HashContainer
              gap={withCopyIcon ? SpacingSize.Small : SpacingSize.Tiny}
              withHover
            >
              {children}
              {copyElement}
            </HashContainer>
          )}
        </>
      )}
      valueToCopy={valueToCopy}
    />
  );
};
