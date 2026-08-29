import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Online npm-audit gate over the committed lock: any reported advisory is
// red. No accepted-advisories machinery; the fix path is a dependency fix
// or an override. If an advisory ever must be accepted instead, escalate to
// the exception-map form in docsy's tests/npm-audit.test.mjs.

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

test('npm audit reports no advisories for the committed lock', () => {
  const res = spawnSync('npm', ['audit'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
  assert.equal(res.error, undefined, 'npm audit started');
  assert.equal(
    res.status,
    0,
    `npm audit exits green:\n${res.stdout}\n${res.stderr}`,
  );
});
