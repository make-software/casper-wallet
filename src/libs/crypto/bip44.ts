// Registered at https://github.com/satoshilabs/slips/blob/master/slip-0044.md
const CSPR_COIN_INDEX = 506;

export function getBip44Path(index: number): string {
  return [
    'm',
    `44'`, // bip 44
    `${CSPR_COIN_INDEX}'`, // coin index
    `0'`, // wallet
    `0`, // external
    `${index}` // child account index
  ].join('/');
}
