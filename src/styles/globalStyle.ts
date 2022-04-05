import { createGlobalStyle } from 'styled-components';
import { Theme } from './types';

export const GlobalStyle = createGlobalStyle<{ theme: Theme }>`
  body {
    background: ${props => props.theme.background};
    padding: ${props => props.theme.padding}px;
    
    min-width: 360px;
    min-height: 560px;    
    height: 100%;
    
    margin: 0;

    font-family: 'Inter', sans-serif;
    
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
  }
`;
