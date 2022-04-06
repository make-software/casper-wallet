export interface Theme {
  background: string;
  padding: number;
  header: {
    main: string;
  };
  typography: {
    color: {
      main: string;
      second: string;
      utility: string;
      accent: string;
    };
    marginTop: number;
    marginBottom: number;
  };
  button: {
    marginTop: number;
    marginBottom: number;
    color: {
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
  };
  input: {
    background: string;
    marginTop: number;
    marginBottom: number;
    text: {
      main: string;
      placeholder: {
        main: string;
      };
      icon: {
        main: string;
        second: string;
      };
    };
  };
}
