import React from 'react';
import { render } from '@testing-library/react';
import { withMarkup } from '@testHelpers/withMarkups';

import { Popup } from '../Popup';

describe('Popup', () => {
  it('should render correct', () => {
    const textOnSite = 'Learn React!';
    const { getByText } = render(<Popup />);
    const getByTextWithMarkup = withMarkup(getByText);

    getByTextWithMarkup(textOnSite);
  });
});
