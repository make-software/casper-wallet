import React from 'react';
import { render } from '@testing-library/react';

import { HeaderAlign, HeaderLevel } from '../types';
import { Header } from '../Header';

describe('Header', () => {
  describe('by default', () => {
    it('should use "left" for align', () => {
      const { container } = render(<Header>header</Header>);
      expect(container.firstChild).toHaveStyle('text-align: left');
    });

    it('should use "h2" for level', () => {
      const { getByRole } = render(<Header>header</Header>);
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
          <Header level={abstractLevel}>header</Header>
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
          <Header align={abstractAlign}>header</Header>
        );
        expect(container.firstChild).toHaveStyle(`text-align: ${align}`);
      });
    }
  );
});
