import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Bumps hugo-extended to the version docsy tested against the installed
// @docsy/theme release (theme releases map 1:1 to docsy tags), or to an
// explicit X.Y.Z argument (needed e.g. for -dev theme installs, which have
// no tag). Follow-ups keep the install usable under the script gates: the
// allowScripts pin refresh and the surgical binary rebuild.

const STABLE_SEMVER = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){2}$/;

async function targetVersion(arg) {
  if (arg) {
    if (!STABLE_SEMVER.test(arg)) {
      throw new Error(`usage: npm run update:hugo [-- X.Y.Z]; got "${arg}"`);
    }
    return arg;
  }
  const theme = JSON.parse(
    readFileSync(
      new URL('../node_modules/@docsy/theme/package.json', import.meta.url),
      'utf8',
    ),
  ).version;
  if (!STABLE_SEMVER.test(theme)) {
    throw new Error(
      `@docsy/theme ${theme} has no docsy release tag; pass an explicit version: npm run update:hugo -- X.Y.Z`,
    );
  }
  // The tested pin's manifest moved over time: root on current main,
  // docsy.dev/ at v0.16-era tags.
  for (const manifestPath of ['package.json', 'docsy.dev/package.json']) {
    const url = `https://raw.githubusercontent.com/google/docsy/v${theme}/${manifestPath}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const pin = (await res.json()).devDependencies?.['hugo-extended'];
    if (STABLE_SEMVER.test(pin ?? '')) {
      console.log(`docsy v${theme} tested against hugo-extended ${pin}`);
      return pin;
    }
  }
  throw new Error(
    `no stable hugo-extended pin found in docsy v${theme}; pass one explicitly: npm run update:hugo -- X.Y.Z`,
  );
}

function npm(args) {
  const res = spawnSync('npm', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

const version = await targetVersion(process.argv[2]);
npm([
  'install',
  '--save-exact',
  '--ignore-scripts',
  '-D',
  `hugo-extended@${version}`,
]);
npm(['approve-scripts', '--allow-scripts-pin', 'hugo-extended']);
npm(['rebuild', 'hugo-extended', '--ignore-scripts=false']);
