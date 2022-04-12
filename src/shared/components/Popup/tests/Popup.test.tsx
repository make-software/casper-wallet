import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { withMarkup } from '@testHelpers/withMarkups';
import { themeConfig } from '@src/libs/ui/theme-config';

import { Popup } from '../Popup';

describe('Popup', () => {
  it('should render correct', () => {
    const textOnSite = 'Create new vault';
    const { getByText } = render(
      <ThemeProvider theme={themeConfig}>
        <Popup />
      </ThemeProvider>
    );
    const getByTextWithMarkup = withMarkup(getByText);

    getByTextWithMarkup(textOnSite);
  });
});
