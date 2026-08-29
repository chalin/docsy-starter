// Offline sanity canaries for the Lychee link checker and this repo's use of
// it: guard the binary install and the fragment / pretty-URL semantics that
// give htmltest parity, so a config edit or lychee upgrade can't silently
// weaken the checked link set. Slimmed from the Docsy theme repo's
// tests/lychee suite. Run via `npm run test:lychee` (CI: Links workflow,
// after the lychee install); kept out of test:repo, which stays install-free.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const FILES = {
  'target.html': '<!doctype html><meta charset=utf-8><h2 id="known">known</h2>',
  'links-ok.html':
    '<a href="target.html">path</a> <a href="target.html#known">fragment</a>',
  'links-bad-path.html': '<a href="missing.html">missing path</a>',
  'links-bad-fragment.html': '<a href="target.html#absent">absent fragment</a>',
  'pretty/index.html': '<!doctype html><meta charset=utf-8><h2 id="pa">pa</h2>',
  'links-pretty-fragment.html': '<a href="pretty/#pa">pretty fragment</a>',
};

let dir;

before(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'lychee-sanity-'));
  for (const [rel, html] of Object.entries(FILES)) {
    const abs = path.join(dir, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, html);
  }
});

after(() => rmSync(dir, { recursive: true, force: true }));

const fx = (f) => path.join(dir, f);

function runLychee(args) {
  // cwd is the fixture dir: at the repo root, lychee would auto-load
  // ./lychee.toml (index_files, cache=true) and contaminate these runs.
  const r = spawnSync(
    'lychee',
    ['--format', 'json', '--no-progress', '--offline', ...args],
    { encoding: 'utf8', cwd: dir },
  );
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    /* non-JSON output, e.g. --version */
  }
  return { status: r.status, json };
}

const FRAGMENTS = ['--include-fragments'];

test('lychee binary is installed and reports a version', () => {
  const r = spawnSync('lychee', ['--version'], { encoding: 'utf8' });
  assert.equal(r.status, 0, 'lychee --version exits 0 (install lychee if not)');
  assert.match(r.stdout, /lychee \d+\.\d+/, 'a lychee version is printed');
});

const REPO_ROOT = path.join(import.meta.dirname, '../..');

test('lychee.toml keeps the htmltest-parity fragment settings', () => {
  const toml = readFileSync(path.join(REPO_ROOT, 'lychee.toml'), 'utf8');
  assert.match(
    toml,
    /^include_fragments\s*=\s*"full"/m,
    'fragment checking is on',
  );
  assert.match(
    toml,
    /^index_files\s*=\s*\["index\.html"\]/m,
    'pretty-URL dir links resolve to index.html',
  );
});

test('valid local path and fragment links pass', () => {
  const r = runLychee([...FRAGMENTS, fx('links-ok.html')]);
  assert.equal(r.json.errors, 0, 'valid local links are reachable');
});

test('a broken local path link is reported', () => {
  const r = runLychee([...FRAGMENTS, fx('links-bad-path.html')]);
  assert.ok(r.json.errors >= 1, 'a missing local target is an error');
  assert.notEqual(r.status, 0, 'lychee exits non-zero on a broken local link');
});

test('a broken local fragment is reported', () => {
  const r = runLychee([...FRAGMENTS, fx('links-bad-fragment.html')]);
  assert.ok(r.json.errors >= 1, 'a missing local fragment is an error');
});

// `--index-files` resolves a Hugo pretty-URL dir link (/foo/) to
// foo/index.html for fragment checks. See lychee #1751, #1718.
test('a fragment on a Hugo pretty-URL directory resolves via --index-files', () => {
  const r = runLychee([
    ...FRAGMENTS,
    '--index-files',
    'index.html',
    '--root-dir',
    dir,
    fx('links-pretty-fragment.html'),
  ]);
  assert.equal(r.json.errors, 0, 'a pretty-URL page fragment is reachable');
});

test('without --index-files, a pretty-URL fragment is (still) reported missing', () => {
  const r = runLychee([
    ...FRAGMENTS,
    '--root-dir',
    dir,
    fx('links-pretty-fragment.html'),
  ]);
  assert.ok(
    r.json.errors >= 1,
    'documents that index_files is required for pretty-URL fragments',
  );
});
