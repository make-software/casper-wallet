import Big from 'big.js';

export const MOTES_PER_CSPR_RATE = '1000000000'; // 1 000 000 000 MOTES === 1 CSPR

export const motesToCSPR = (motes: string): string => {
  return Big(motes).div(MOTES_PER_CSPR_RATE).toString();
};
