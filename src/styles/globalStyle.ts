import { createGlobalStyle } from 'styled-components';
import { Theme } from './types';

export const GlobalStyle = createGlobalStyle<{ theme: Theme }>`
  body {
    background: ${props => props.theme.background};
    min-width: 400px;
    min-height: 400px;
    
    width: 100%;
    height: 100%;
    
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
  }
`;
