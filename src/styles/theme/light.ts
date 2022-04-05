import { Theme } from '../types';
import { Color } from '../colors';

export const light: Theme = {
  background: Color.white,
  padding: 20,
  header: {
    main: Color.black
  },
  typography: {
    main: Color.black,
    second: Color.darkGray,
    utility: Color.lightGray,
    accent: Color.darkBlue
  },
  button: {
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
  input: {
    text: {
      icon: {
        main: Color.red,
        second: Color.darkBlue
      }
    }
  }
};
