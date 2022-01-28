import React from 'react';
import { render } from 'react-dom';

import Options from './Options';

render(
  <Options title={'Settings'} />,
  window.document.querySelector('#app-container')
);

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
