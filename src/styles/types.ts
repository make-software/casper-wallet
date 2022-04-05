export interface Theme {
  background: string;
  header: {
    main: string;
  };
  typography: {
    main: string;
    second: string;
    utility: string;
    accent: string;
  };
  button: {
    main: {
      background: string;
      text: string;
    };
    second: {
      background: string;
      text: string;
    };
    utility: {
      background: string;
      text: string;
    };
  };
  input: {
    text: {
      icon: {
        main: string;
        second: string;
      };
    };
  };
}
