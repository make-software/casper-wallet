import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle<{ theme: any }>`
  html {
    height: 100%;
    
    font-size: 10px;
    background: ${props => props.theme.color.backgroundSecondary};
  }
  
  body {
    height: 100%;
    min-height: 600px;
    min-width: 360px;
    padding: 0;

    background: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .ms-container {
    height: 100%;
  }
  
  #app-container {
    height: 100%;
    background: ${props => props.theme.color.backgroundSecondary};
    border-radius: 16px;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    
    font-family: 'Inter', sans-serif;
  }
`;
