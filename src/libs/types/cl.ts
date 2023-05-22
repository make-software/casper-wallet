type CLTypeMapResult = {
  Map: {
    key: string;
    value: string;
  };
};

type CLTypeMapParsedResult = {
  key: string;
  value: string;
};

type CLTypeOptionResult = {
  Option: string;
};

export type CLTypeParsedAccountResult = {
  Account: string;
};

export type CLTypeParsedListResult = (CLTypeMapParsedResult | string)[];

export type CLTypeTypeResult = CLTypeMapResult | CLTypeOptionResult | string;

export type CLTypeParsedResult =
  | CLTypeParsedListResult
  | CLTypeParsedAccountResult
  | CLTypeMapParsedResult
  | string
  | number;
