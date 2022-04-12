import { createGlobalStyle } from 'styled-components';
import { Theme } from './types';

export const GlobalStyle = createGlobalStyle<{ theme: Theme }>`
  body {
    background: none;
    padding: 0;
    
    min-width: 360px;
    min-height: 560px;    
    height: 100%;
    
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    
    font-size: 15px;
  }
  
  #app-container {
    background: ${props => props.theme.background};
    padding: ${props => props.theme.padding[2]};
    
    border-radius: 16px;
    
    height: 100%;
    min-height: 560px;

    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    
    font-family: 'Inter', sans-serif;
  }
  
  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
  }
`;
