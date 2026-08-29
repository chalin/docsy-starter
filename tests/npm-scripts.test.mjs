import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Bans npm's lifecycle namespace from script names: npm skips lifecycle
// hooks under `ignore-scripts` installs and configs (this repo commits
// ignore-scripts=true), so a hook-shaped step silently drops out of a chain
// it appears to be part of. Banning by shape also rejects orphan hooks and
// names a later script would turn into hooks (a `preview` script hooks
// `view`). The bare names are npm's self-initiated lifecycles outside the
// pre/post shape; start/stop/restart/test run only when invoked, so they
// stay legal. Trimmed from docsy-example's tests/npm-scripts.test.mjs.

const manifestUrl = new URL('../package.json', import.meta.url);
const { scripts = {} } = JSON.parse(readFileSync(manifestUrl, 'utf8'));

test('npm scripts declare no lifecycle or hook-shaped names', () => {
  const names = Object.keys(scripts);
  assert.ok(names.length > 0, 'the manifest declares scripts to guard');
  for (const name of names) {
    assert.ok(
      !/^(pre|post)/.test(name) &&
        !['install', 'dependencies', 'publish', 'version'].includes(name),
      `${name} stays outside npm's lifecycle namespace, so every script runs the same with and without ignore-scripts`,
    );
  }
});
