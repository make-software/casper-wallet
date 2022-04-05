import React from 'react';
import { ThemeProvider } from 'styled-components';

import { render } from '@testing-library/react';

import { light } from '@src/styles/theme/light';
import { Color } from '@src/styles/colors';

import { Typography } from '../Typography';
import { TypographyAlign, TypographyColor } from '@src/ui-kit/Typography';

describe('Typography', () => {
  describe('by default', () => {
    it('should use "left" for align', () => {
      const { container } = render(
        <ThemeProvider theme={light}>
          <Typography>typography</Typography>
        </ThemeProvider>
      );
      expect(container.firstChild).toHaveStyle('text-align: left');
    });

    it('should use "main color" from theme', () => {
      const { container } = render(
        <ThemeProvider theme={light}>
          <Typography>typography</Typography>
        </ThemeProvider>
      );
      expect(container.firstChild).toHaveStyle(
        `color: ${light.typography[TypographyColor.main]}`
      );
    });
  });

  it('should use 15px font size', () => {
    const { container } = render(
      <ThemeProvider theme={light}>
        <Typography>typography</Typography>
      </ThemeProvider>
    );
    expect(container.firstChild).toHaveStyle('font-size: 15px');
  });

  describe.each`
    align       | abstractAlign             | color              | abstractColor              | fontSize
    ${'left'}   | ${TypographyAlign.left}   | ${Color.black}     | ${TypographyColor.main}    | ${10}
    ${'right'}  | ${TypographyAlign.right}  | ${Color.darkGray}  | ${TypographyColor.second}  | ${20}
    ${'center'} | ${TypographyAlign.center} | ${Color.darkBlue}  | ${TypographyColor.accent}  | ${15}
    ${'left'}   | ${TypographyAlign.left}   | ${Color.lightGray} | ${TypographyColor.utility} | ${18}
  `(
    'with props `align=TypographyAlign.$align`, `color=TypographyColor.$abstractColor` and `fontSize=fontSize` ',
    ({ align, abstractAlign, color, abstractColor, fontSize }) => {
      const { container } = render(
        <ThemeProvider theme={light}>
          <Typography
            align={abstractAlign}
            color={abstractColor}
            fontSize={fontSize}
          >
            typography
          </Typography>
        </ThemeProvider>
      );
      expect(container.firstChild).toHaveStyle(`font-size: ${fontSize}px`);
      expect(container.firstChild).toHaveStyle(`text-align: ${align}`);
      expect(container.firstChild).toHaveStyle(`color: ${color}`);
    }
  );
});
