import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`



  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Arial, sans-serif;
    font-size: 16px;
    background: rgb(24, 24, 27);
    color: rgb(255, 255, 255);
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: normal;
  }

  button {
    cursor: pointer;
  }

  a {
    text-decoration: none;
  }

  ul, ol {
    list-style: none;
  }
`;
