#!/usr/bin/env -S npx ts-node --compilerOptions {"isolatedModules":false}

// cwd should be at root

const Browser = {
  Chrome: 'chrome',
  Firefox: 'firefox',
  Safari: 'safari'
};

const exit = (message?: string) => {
  echo('Exited:', message || 'No reason.');
  process.exit(1);
};

Promise.all([import('zx/globals')]).then(async ([_]) => {
  const argumentsValidation: Array<{
    argName: string;
    expected: string[];
  }> = [
    { argName: 'task', expected: ['build', 'watch'] },
    { argName: 'manifestVersion', expected: ['2', '3'] },
    { argName: 'browser', expected: Object.values(Browser) }
  ];

  argumentsValidation.forEach(({ argName, expected }) => {
    const val = argv[argName];
    if (!val) {
      exit(`${argName} arg is missing.`);
    }

    if (!expected.includes(String(val))) {
      exit(
        `${argName} arg should be one of (${expected}), but received (${val})`
      );
    }
  });

  // argv
  const task = argv['task'];
  const manifestVersion = argv['manifestVersion'];
  const browser = argv['browser'];

  echo('Creating manifest.json from template...');
  const pkg = await fs.readJson('package.json');
  const manifest = await fs.readJson(`src/manifest.v${manifestVersion}.json`);
  manifest.name = pkg.name;
  echo('- name:' + manifest.name);
  manifest.version = pkg.version;
  echo('- version:' + manifest.version);
  await fs.writeJson('src/manifest.json', manifest);

  try {
    switch (task) {
      case 'build':
      case 'watch':
        await $`rm -rf dist`;
        await $`mkdir -p dist/assets && cp -R src/assets/{icons,illustrations} dist/assets`;
        await $`cp -R public/* dist`;
        if (browser === Browser.Firefox) {
          // await $`web-ext run --source-dir ${path.resolve(
          //   './dist'
          // )} -u about:debugging#/runtime/this-firefox`;
        }
        await $`parcel ${task} src/manifest.json src/apps/connect-to-app/index.html src/apps/import-account-with-file/index.html --no-cache`;
        break;

      default:
        break;
    }
  } catch (error) {}

  cleanup();

  async function cleanup() {
    await $`rm src/manifest.json`;
  }
});
