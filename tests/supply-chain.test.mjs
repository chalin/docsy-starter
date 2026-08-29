import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Narrow regression guards over the gates this repo commits: the locked
// install-script inventory, its allowScripts disposition, and the .npmrc
// assignment set. Docsy's tests/supply-chain-audit.test.mjs is the full
// form; port more of it only when a new invariant needs guarding.

const read = (rel) =>
  readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
const readJSON = (rel) => JSON.parse(read(rel));

test('locked install-script packages match the reviewed inventory', () => {
  const { packages } = readJSON('package-lock.json');
  const withInstallScript = Object.entries(packages)
    .filter(([, pkg]) => pkg.hasInstallScript)
    .map(([key]) => key);
  assert.deepEqual(
    withInstallScript,
    ['node_modules/hugo-extended'],
    'locked install-script packages match the reviewed inventory',
  );
});

test('allowScripts covers exactly the locked install-script packages', () => {
  // Version-pinned so a bump's new (unreviewed) script fails npm ci under
  // strict-allow-scripts; approve:hugo refreshes the pin.
  const { version } =
    readJSON('package-lock.json').packages['node_modules/hugo-extended'];
  assert.deepEqual(
    readJSON('package.json').allowScripts,
    { [`hugo-extended@${version}`]: true },
    'allowScripts covers exactly the locked install-script packages',
  );
});

test('.npmrc carries exactly the reviewed npm settings', () => {
  // npm takes a key's last assignment, so spot-checks can be reversed by a
  // later line: pin the full assignment set.
  const lines = read('.npmrc')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
  assert.deepEqual(
    lines,
    [
      'min-release-age=7',
      'strict-allow-scripts=true',
      'engine-strict=true',
      'ignore-scripts=true',
      'script-shell=bash',
    ],
    '.npmrc carries exactly the reviewed npm settings',
  );
});
