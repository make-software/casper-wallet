import path from 'path';
import { promises as fs } from 'fs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import { exitWithError, runInShell } from './utils';
import { e2eConfigFilename } from './constants';

async function main() {
  const { argv } = yargs(hideBin(process.argv))
    .usage(
      '$0 [options]',
      'Run all E2E tests, with a variable number of retries.',
      (_yargs: any) =>
        _yargs
          .option('browser', {
            description: `Set the browser used; either 'chrome' or 'firefox'.`,
            type: 'string',
            choices: ['chrome', 'firefox']
          })
          .option('retries', {
            description:
              'Set how many times the test should be retried upon failure.',
            type: 'number'
          })
    )
    .strict()
    .help('help');

  const { browser, retries } = argv;

  const testDir = path.join(__dirname, 'tests');

  const testFilenames = await fs.readdir(testDir);
  const testPaths = testFilenames.map((filename: string) =>
    path.join(testDir, filename)
  );

  const runE2eTestPath = path.join(__dirname, 'run-e2e-test.ts');

  const args = [runE2eTestPath];
  if (browser) {
    args.push('--browser', browser as string);
  }
  if (retries) {
    args.push('--retries', retries as string);
  }

  const tsconfigPath = path.join(__dirname, '..', e2eConfigFilename);
  for (const testPath of testPaths) {
    await runInShell('ts-node', ['--project', tsconfigPath, ...args, testPath]);
  }
}

main().catch(error => {
  exitWithError(error);
});
