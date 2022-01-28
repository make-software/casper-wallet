import { printLine } from '../print';

// @ts-ignore
console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  dir: jest.fn()
};

describe('printLine()', () => {
  const prePhrase = '===> FROM THE PRINT MODULE:';

  it('should print text passed as argument with pre-phrase', () => {
    const argument = 'text';
    printLine(argument);

    expect(console.log).toHaveBeenCalledWith(prePhrase, argument);
  });
});
