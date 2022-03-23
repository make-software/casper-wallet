import * as fs from 'fs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import { exitWithError, runInShell, retry } from './utils';
import path from 'path';

import { e2eConfigFilename } from './constants';

async function main() {
  const { argv } = yargs(hideBin(process.argv))
    .usage(
      '$0 [options] <e2e-test-path>',
      'Run a single E2E test, with a variable number of retries.',
      (_yargs: any) =>
        _yargs
          .option('browser', {
            default: process.env.SELENIUM_BROWSER,
            description: `Set the browser used; either 'chrome' or 'firefox'.`,
            type: 'string',
            choices: ['chrome', 'firefox']
          })
          .option('retries', {
            default: 0,
            description:
              'Set how many times the test should be retried upon failure.',
            type: 'number'
          })
          .option('leave-running', {
            default: false,
            description:
              'Leaves the browser running after a test fails, along with anything else that the test used (ganache, the test dapp, etc.)',
            type: 'boolean'
          })
          .positional('e2e-test-path', {
            describe: 'The path for the E2E test to run.',
            type: 'string',
            normalize: true
          })
    )
    .strict()
    .help('help');

  const { browser, e2eTestPath, retries, leaveRunning } = argv;

  if (!browser) {
    exitWithError(
      `"The browser must be set, via the '--browser' flag or the SELENIUM_BROWSER environment variable`
    );
    return;
  } else if (browser !== process.env.SELENIUM_BROWSER) {
    process.env.SELENIUM_BROWSER = browser as string;
  }

  try {
    const stat = await fs.promises.stat(e2eTestPath as string);
    if (!stat.isFile()) {
      exitWithError('Test path must be a file');
      return;
    }
  } catch (error: any) {
    if (!('code' in error)) {
      throw error;
    }

    if (error.code === 'ENOENT') {
      exitWithError('Test path specified does not exist');
      return;
    } else if (error.code === 'EACCES') {
      exitWithError(
        'Access to test path is forbidden by file access permissions'
      );
      return;
    }
  }

  if (leaveRunning) {
    process.env.E2E_LEAVE_RUNNING = 'true';
  }

  const tsconfigPath = path.join(__dirname, '..', e2eConfigFilename);
  await retry({ retries: retries as number }, async () => {
    await runInShell('ts-mocha', [
      '-p',
      tsconfigPath,
      '--no-config',
      '--no-timeouts',
      e2eTestPath as string
    ]);
  });
}

main().catch(error => {
  exitWithError(error);
});
