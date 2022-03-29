import React from 'react';
import { render } from 'react-dom';

import Panel from './Panel';

render(<Panel />, window.document.querySelector('#app-container'));

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
