import React from 'react';
import { ThemeProvider } from 'styled-components';

import { render } from '@testing-library/react';

import { light } from '@src/styles/theme/light';
import { HeaderAlign, HeaderLevel } from '../types';
import { Header } from '../Header';

describe('Header', () => {
  describe('by default', () => {
    it('should use "left" for align', () => {
      const { container } = render(
        <ThemeProvider theme={light}>
          <Header>header</Header>
        </ThemeProvider>
      );
      expect(container.firstChild).toHaveStyle('text-align: left');
    });

    it('should use "h2" for level', () => {
      const { getByRole } = render(
        <ThemeProvider theme={light}>
          <Header>header</Header>
        </ThemeProvider>
      );
      expect(getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe.each`
    level | abstractLevel
    ${1}  | ${HeaderLevel.h1}
    ${2}  | ${HeaderLevel.h2}
    ${3}  | ${HeaderLevel.h3}
    ${4}  | ${HeaderLevel.h4}
    ${5}  | ${HeaderLevel.h5}
    ${6}  | ${HeaderLevel.h6}
  `(
    'with prop `level=HeaderLevel.$abstractLevel`',
    ({ level, abstractLevel }) => {
      it(`should use <h${level}> tag inside`, () => {
        const { getByRole } = render(
          <ThemeProvider theme={light}>
            <Header level={abstractLevel}>header</Header>
          </ThemeProvider>
        );
        expect(getByRole('heading', { level })).toBeInTheDocument();
      });
    }
  );

  describe.each`
    align       | abstractAlign
    ${'left'}   | ${HeaderAlign.left}
    ${'center'} | ${HeaderAlign.center}
    ${'right'}  | ${HeaderAlign.right}
  `(
    'with prop `align=HeaderAlign.$abstractAlign`',
    ({ align, abstractAlign }) => {
      it(`should have 'text-align' rule with value '${align}'`, () => {
        const { container } = render(
          <ThemeProvider theme={light}>
            <Header align={abstractAlign}>header</Header>
          </ThemeProvider>
        );
        expect(container.firstChild).toHaveStyle(`text-align: ${align}`);
      });
    }
  );
});
