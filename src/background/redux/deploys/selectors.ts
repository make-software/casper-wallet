import { RootState } from 'typesafe-actions';

export const selectDeploysJsonById = (state: RootState) =>
  state.deploys.jsonById;
