import { existsSync, readFileSync } from 'node:fs';

// Prints the hugo-extended version docsy tested against the installed
// theme release (theme releases map 1:1 to docsy tags). Only the
// version goes to stdout: update:hugo consumes it via command substitution.
// The tested pin's manifest moved over time: root on current main,
// docsy.dev/ at v0.16-era tags.
// The theme manifest is resolved across install forms: the @docsy/theme
// registry package, or the docsy GitHub package (theme in a subfolder).

const STABLE_SEMVER = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){2}$/;

const theme = JSON.parse(readFileSync(resolveThemeManifest(), 'utf8')).version;

function resolveThemeManifest() {
  const candidates = [
    '../node_modules/@docsy/theme/package.json',
    '../node_modules/docsy/theme/package.json',
  ];
  for (const rel of candidates) {
    const url = new URL(rel, import.meta.url);
    if (existsSync(url)) return url;
  }
  console.error(
    'Docsy theme package not found; install it first (npm run install:safe)',
  );
  process.exit(1);
}
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
