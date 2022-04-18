import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle<{ theme: any }>`
  html {
    font-size: 15px;
  }
  
  body {
    background: none;
    padding: 0;
    
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    
    font-size: 15px;
  }
  
  #app-container {
    background: ${props => props.theme.color.gray1};
    border-radius: 16px;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    
    font-family: 'Inter', sans-serif;
  }
`;
