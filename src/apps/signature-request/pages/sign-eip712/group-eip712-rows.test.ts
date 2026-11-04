import { EIP712PathSegment, IEIP712DisplayRow } from 'casper-wallet-core';

import { groupEip712Rows } from './group-eip712-rows';

const row = (label: string, path?: EIP712PathSegment[]): IEIP712DisplayRow => ({
  label,
  value: label,
  displayValue: label,
  presentation: 'string',
  type: 'string',
  copyValue: null,
  accountInfo: null,
  contractPackage: null,
  path,
  depth: path ? path.filter(s => typeof s === 'string').length - 1 : undefined
});

const shape = (rows: IEIP712DisplayRow[]) =>
  groupEip712Rows(rows).map(entry =>
    entry.kind === 'row'
      ? entry.item.label
      : { [entry.label]: entry.items.map(item => item.label) }
  );

describe('groupEip712Rows', () => {
  it('groups fields of a struct under its label and keeps top-level rows flat', () => {
    expect(
      shape([
        row('Permitted › Token', ['permitted', 'token']),
        row('Permitted › Amount', ['permitted', 'amount']),
        row('Spender', ['spender']),
        row('Sig Deadline', ['sigDeadline'])
      ])
    ).toEqual(['Spender', 'Sig Deadline', { Permitted: ['Token', 'Amount'] }]);
  });

  it('gives each array element of structs its own group', () => {
    expect(
      shape([
        row('Details #1 › Token', ['details', 0, 'token']),
        row('Details #1 › Amount', ['details', 0, 'amount']),
        row('Details #2 › Token', ['details', 1, 'token']),
        row('Details #2 › Amount', ['details', 1, 'amount'])
      ])
    ).toEqual([
      { 'Details #1': ['Token', 'Amount'] },
      { 'Details #2': ['Token', 'Amount'] }
    ]);
  });

  it('labels a nested struct group with its full path', () => {
    expect(
      shape([
        row('Permit › Details › Token', ['permit', 'details', 'token']),
        row('Permit › Details › Amount', ['permit', 'details', 'amount']),
        row('Permit › Spender', ['permit', 'spender']),
        row('Permit › Nonce', ['permit', 'nonce'])
      ])
    ).toEqual([
      { 'Permit › Details': ['Token', 'Amount'] },
      { Permit: ['Spender', 'Nonce'] }
    ]);
  });

  it('gives each nesting level its own group, in depth-first order', () => {
    expect(
      shape([
        row('L1 › L2 › L3 › A', ['l1', 'l2', 'l3', 'a']),
        row('L1 › L2 › L3 › B', ['l1', 'l2', 'l3', 'b']),
        row('L1 › L2 › X', ['l1', 'l2', 'x']),
        row('L1 › L2 › Y', ['l1', 'l2', 'y']),
        row('L1 › P', ['l1', 'p']),
        row('L1 › Q', ['l1', 'q']),
        row('Top', ['top'])
      ])
    ).toEqual([
      'Top',
      { 'L1 › L2 › L3': ['A', 'B'] },
      { 'L1 › L2': ['X', 'Y'] },
      { L1: ['P', 'Q'] }
    ]);
  });

  it('keeps an array of primitives as top-level rows', () => {
    expect(
      shape([row('Tags #1', ['tags', 0]), row('Tags #2', ['tags', 1])])
    ).toEqual(['Tags #1', 'Tags #2']);
  });

  it('groups primitive array elements inside a struct under that struct', () => {
    expect(
      shape([
        row('Order › Ids #1', ['order', 'ids', 0]),
        row('Order › Ids #2', ['order', 'ids', 1])
      ])
    ).toEqual([{ Order: ['Ids #1', 'Ids #2'] }]);
  });

  it('keeps the full label for a struct with a single field', () => {
    expect(
      shape([
        row('Witness › Recipient', ['witness', 'recipient']),
        row('Spender', ['spender'])
      ])
    ).toEqual(['Spender', 'Witness › Recipient']);
  });

  it('puts every ungrouped row before the first group', () => {
    expect(
      shape([
        row('A › X', ['a', 'x']),
        row('A › Y', ['a', 'y']),
        row('B', ['b']),
        row('A › Z', ['a', 'z']),
        row('A › W', ['a', 'w'])
      ])
    ).toEqual(['B', { A: ['X', 'Y', 'Z', 'W'] }]);
  });

  it('shows a row without a path as is', () => {
    expect(shape([row('Legacy › Field')])).toEqual(['Legacy › Field']);
  });
});
