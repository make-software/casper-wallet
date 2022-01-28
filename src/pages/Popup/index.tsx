import React from 'react';
import { render } from 'react-dom';
import { GlobalStyle } from '../../styles/globalStyle';

import { Popup } from '../../shared/components/Popup';

render(
  <>
    <GlobalStyle />
    <Popup />
  </>,
  window.document.querySelector('#app-container')
);

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
