import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { withMarkup } from '@testHelpers/withMarkups';
import { light } from '@src/styles/theme/light';

import { Popup } from '../Popup';

describe('Popup', () => {
  it('should render correct', () => {
    const textOnSite = 'Create new vault';
    const { getByText } = render(
      <ThemeProvider theme={light}>
        <Popup />
      </ThemeProvider>
    );
    const getByTextWithMarkup = withMarkup(getByText);

    getByTextWithMarkup(textOnSite);
  });
});
