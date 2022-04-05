import React from 'react';
import { ThemeProvider } from 'styled-components';

import { render } from '@testing-library/react';

import { light } from '@src/styles/theme/light';
import { TitleAlign, TitleLevel } from '../types';
import { Title } from '../Title';

describe('Header', () => {
  describe('by default', () => {
    it('should use "left" for align', () => {
      const { container } = render(
        <ThemeProvider theme={light}>
          <Title>header</Title>
        </ThemeProvider>
      );
      expect(container.firstChild).toHaveStyle('text-align: left');
    });

    it('should use "h2" for level', () => {
      const { getByRole } = render(
        <ThemeProvider theme={light}>
          <Title>header</Title>
        </ThemeProvider>
      );
      expect(getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe.each`
    level | abstractLevel
    ${1}  | ${TitleLevel.h1}
    ${2}  | ${TitleLevel.h2}
    ${3}  | ${TitleLevel.h3}
    ${4}  | ${TitleLevel.h4}
    ${5}  | ${TitleLevel.h5}
    ${6}  | ${TitleLevel.h6}
  `(
    'with prop `level=TitleLevel.$abstractLevel`',
    ({ level, abstractLevel }) => {
      it(`should use <h${level}> tag inside`, () => {
        const { getByRole } = render(
          <ThemeProvider theme={light}>
            <Title level={abstractLevel}>header</Title>
          </ThemeProvider>
        );
        expect(getByRole('heading', { level })).toBeInTheDocument();
      });
    }
  );

  describe.each`
    align       | abstractAlign
    ${'left'}   | ${TitleAlign.left}
    ${'center'} | ${TitleAlign.center}
    ${'right'}  | ${TitleAlign.right}
  `(
    'with prop `align=TitleAlign.$abstractAlign`',
    ({ align, abstractAlign }) => {
      it(`should have 'text-align' rule with value '${align}'`, () => {
        const { container } = render(
          <ThemeProvider theme={light}>
            <Title align={abstractAlign}>header</Title>
          </ThemeProvider>
        );
        expect(container.firstChild).toHaveStyle(`text-align: ${align}`);
      });
    }
  );
});
