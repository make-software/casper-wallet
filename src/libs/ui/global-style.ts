import { createGlobalStyle, css } from 'styled-components';

const BodyStyle = css`
  height: 100%;
  min-height: 600px;
  padding: 0;

  background: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

export const GlobalStyleBase = css`
  html {
    height: 100%;

    font-size: 10px;
    background: ${props => props.theme.color.backgroundSecondary};
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

export const GlobalStyle = createGlobalStyle<{ theme: any }>`
  ${GlobalStyleBase};
  body {
    ${BodyStyle};
    min-width: 360px;
  }
`;

export const WindowGlobalStyle = createGlobalStyle<{ theme: any }>`
  ${GlobalStyleBase};
  body {
    ${BodyStyle};
  }
`;
