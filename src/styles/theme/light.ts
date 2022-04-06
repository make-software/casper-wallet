import { Theme } from '../types';
import { Color } from '../colors';

export const light: Theme = {
  background: Color.white,
  padding: 20,
  header: {
    main: Color.black
  },
  typography: {
    color: {
      main: Color.black,
      second: Color.darkGray,
      utility: Color.lightGray,
      accent: Color.darkBlue
    },
    marginBottom: 24,
    marginTop: 12
  },
  button: {
    color: {
      main: {
        background: Color.red,
        text: Color.white
      },
      second: {
        background: Color.darkBlue,
        text: Color.white
      },
      utility: {
        background: '#F3F4F5',
        text: Color.darkGray
      }
    },
    marginTop: 10,
    marginBottom: 10
  },
  input: {
    background: Color.almostWhite,
    marginTop: 10,
    marginBottom: 10,
    text: {
      main: Color.black,
      placeholder: {
        main: Color.darkGray
      },
      icon: {
        main: Color.red,
        second: Color.darkBlue
      }
    }
  }
};
