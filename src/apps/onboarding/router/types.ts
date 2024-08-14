import { ErrorLocationState } from '@libs/layout';

export interface LocationState extends ErrorLocationState {
  secretPhrase?: string[];
}
