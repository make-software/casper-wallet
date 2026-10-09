import { HomeAction, selectHomeActions } from './home-actions';

const allAvailable: Record<HomeAction, boolean> = {
  buy: true,
  send: true,
  swap: true,
  delegate: true,
  receive: true
};

describe('selectHomeActions', () => {
  it('takes the first three by priority when everything is available', () => {
    expect(selectHomeActions(allAvailable)).toEqual(['buy', 'send', 'swap']);
  });

  it('fills the slot freed by Swap with Delegate', () => {
    expect(selectHomeActions({ ...allAvailable, swap: false })).toEqual([
      'buy',
      'send',
      'delegate'
    ]);
  });

  it('shows Send, Delegate, Receive when neither Buy nor Swap is offered', () => {
    expect(
      selectHomeActions({ ...allAvailable, buy: false, swap: false })
    ).toEqual(['send', 'delegate', 'receive']);
  });
});
