import { readFileSync } from 'node:fs';

// Prints the hugo-extended version docsy tested against the installed
// @docsy/theme release (theme releases map 1:1 to docsy tags). Only the
// version goes to stdout: update:hugo consumes it via command substitution.
// The tested pin's manifest moved over time: root on current main,
// docsy.dev/ at v0.16-era tags.

const STABLE_SEMVER = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){2}$/;

const theme = JSON.parse(
  readFileSync(
    new URL('../node_modules/@docsy/theme/package.json', import.meta.url),
    'utf8',
  ),
).version;
if (!STABLE_SEMVER.test(theme)) {
  console.error(
    `@docsy/theme ${theme} has no docsy release tag; pass the version explicitly: VERSION=X.Y.Z npm run update:hugo`,
  );
  process.exit(1);
}

for (const manifestPath of ['package.json', 'docsy.dev/package.json']) {
  const url = `https://raw.githubusercontent.com/google/docsy/v${theme}/${manifestPath}`;
  const res = await fetch(url);
  if (!res.ok) continue;
  const pin = (await res.json()).devDependencies?.['hugo-extended'];
  if (STABLE_SEMVER.test(pin ?? '')) {
    console.error(`docsy v${theme} tested against hugo-extended ${pin}`);
    console.log(pin);
    process.exit(0);
  }
}
console.error(
  `no stable hugo-extended pin found in docsy v${theme}; pass one explicitly: VERSION=X.Y.Z npm run update:hugo`,
);
process.exit(1);
