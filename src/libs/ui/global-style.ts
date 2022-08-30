import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle<{ theme: any }>`
  html {
    height: 100%;
    
    font-size: 10px;
    background: ${props => props.theme.color.backgroundSecondary};
  }
  
  body {
    height: 100%;
    
    background: none;
    padding: 0;
    
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  #app-container {
    background: ${props => props.theme.color.backgroundSecondary};
    border-radius: 16px;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    
    font-family: 'Inter', sans-serif;
  }
`;
