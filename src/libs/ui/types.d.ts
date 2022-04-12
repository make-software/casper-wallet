export type BaseProps = {
  id?: string;
  className?: string;
  children?: any;
  style?: React.CSSProperties;
  onClick?: (ev: any) => void;
};

export type ActivableProps = {
  active?: boolean;
};

export type Size = 0 | 1 | 2 | 3 | 4 | 5;
