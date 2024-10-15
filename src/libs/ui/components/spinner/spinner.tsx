import React from 'react';
import styled, { DefaultTheme, keyframes } from 'styled-components';

import { CenteredFlexRow } from '@libs/layout';
import { hexToRGBA } from '@libs/ui/utils';

const spin = (theme: DefaultTheme) => keyframes`
    0%,
    100% {
        box-shadow: 0 -2.6em 0 0 ${
          theme.color.contentSecondary
        }, 1.8em -1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 2.5em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.75em 1.75em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 0 2.5em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em 1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -2.6em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.5'
        )}, -1.8em -1.8em 0 0 ${hexToRGBA(theme.color.contentSecondary, '0.7')};
    }
    12.5% {
        box-shadow: 0 -2.6em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.7'
        )}, 1.8em -1.8em 0 0 ${
          theme.color.contentOnFill
        }, 2.5em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.75em 1.75em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 0 2.5em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em 1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -2.6em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em -1.8em 0 0 ${hexToRGBA(theme.color.contentSecondary, '0.5')};
    }
    25% {
        box-shadow: 0 -2.6em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.5'
        )}, 1.8em -1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.7'
        )}, 2.5em 0 0 0 ${
          theme.color.contentOnFill
        }, 1.75em 1.75em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 0 2.5em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em 1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -2.6em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em -1.8em 0 0 ${hexToRGBA(theme.color.contentSecondary, '0.2')};
    }
    37.5% {
        box-shadow: 0 -2.6em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.8em -1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.5'
        )}, 2.5em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.7'
        )}, 1.75em 1.75em 0 0 ${
          theme.color.contentOnFill
        }, 0 2.5em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em 1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -2.6em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em -1.8em 0 0 ${hexToRGBA(theme.color.contentSecondary, '0.2')};
    }
    50% {
        box-shadow: 0 -2.6em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.8em -1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 2.5em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.5'
        )}, 1.75em 1.75em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.7'
        )}, 0 2.5em 0 0 ${
          theme.color.contentOnFill
        }, -1.8em 1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -2.6em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em -1.8em 0 0 ${hexToRGBA(theme.color.contentSecondary, '0.2')};
    }
    62.5% {
        box-shadow: 0 -2.6em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.8em -1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 2.5em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.75em 1.75em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.5'
        )}, 0 2.5em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.7'
        )}, -1.8em 1.8em 0 0 ${
          theme.color.contentOnFill
        }, -2.6em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em -1.8em 0 0 ${hexToRGBA(theme.color.contentSecondary, '0.2')};
    }
    75% {
        box-shadow: 0 -2.6em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.8em -1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 2.5em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.75em 1.75em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 0 2.5em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.5'
        )}, -1.8em 1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.7'
        )}, -2.6em 0 0 0 ${
          theme.color.contentOnFill
        }, -1.8em -1.8em 0 0 ${hexToRGBA(theme.color.contentSecondary, '0.2')};
    }
    87.5% {
        box-shadow: 0 -2.6em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.8em -1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 2.5em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 1.75em 1.75em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, 0 2.5em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.2'
        )}, -1.8em 1.8em 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.5'
        )}, -2.6em 0 0 0 ${hexToRGBA(
          theme.color.contentSecondary,
          '0.7'
        )}, -1.8em -1.8em 0 0 ${theme.color.contentOnFill};
    }
`;

const SpinnerWrapper = styled(CenteredFlexRow)`
  margin-top: 30px;
`;

const SpinnerCircle = styled.div`
  font-size: 5px;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  position: relative;
  text-indent: -9999em;
  animation: ${props => spin(props.theme)} 1.1s infinite ease;
  transform: translateZ(0);
`;

interface SpinnerProps {
  style?: React.CSSProperties | undefined;
}

export const Spinner = ({ style }: SpinnerProps) => (
  <SpinnerWrapper style={style}>
    <SpinnerCircle />
  </SpinnerWrapper>
);
