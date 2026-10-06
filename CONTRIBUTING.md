# How to Contribute

We'd love to accept your patches and contributions to this project. There are
just a few small guidelines you need to follow.

## Contributor License Agreement

Contributions to this project must be accompanied by a Contributor License
Agreement. You (or your employer) retain the copyright to your contribution;
this simply gives us permission to use and redistribute your contributions as
part of the project. Head over to <https://cla.developers.google.com/> to see
your current agreements on file or to sign a new one.

You generally only need to submit a CLA once, so if you've already submitted one
(even if it was for a different project), you probably don't need to do it
again.

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

## Development

- Requirements: Node and npm per `engines` in [package.json](package.json), and
  bash (npm scripts run under `script-shell=bash`; on Windows, use Git Bash).
  Link checking (`npm run check:links`, also part of `npm test`) needs the
  [lychee][] binary on your `PATH`; CI installs a pinned version.
- Install dependencies with `npm run install:safe`: a lock-exact, script-free
  install that then rebuilds [hugo-extended][], the only dependency approved
  (via `allowScripts`) to run its install script.
- To update Hugo, run `npm run update:hugo` (script-free bump to the version
  Docsy tested against the installed theme), review the new [hugo-extended][]
  release, then run `npm run approve:hugo`; script-enabled installs fail until
  the new version is approved.

### Link checking

For the link cache (the committed `link-cache.jsonc`, its fields, and the
refresh, prune, and seed recipes), see Docsy's [Link checking and the link
cache][]. What differs here:

- The cache and `lychee.toml` are at the repo root.
- CI (`.github/workflows/check-links.yml`) runs the check and fails if it leaves
  the cache changed: commit the updated `link-cache.jsonc` with your change.
- No refresh workflow: a lapsed seed [keeps serving][link-cache's one rule]
  until you prune by hand. Run `npm run link-cache -- -p 0` (drops only lapsed
  entries; `-p N` also drops the N oldest without `expires`), then
  `npm run fix:link-cache` to re-verify those URLs, and commit the cache.

<!-- prettier-ignore-start -->
[hugo-extended]: https://www.npmjs.com/package/hugo-extended
[Link checking and the link cache]: https://main--docsydocs.netlify.app/project/about/maintainer-notes/#link-checking-and-the-link-cache
[link-cache's one rule]: https://github.com/chalin/link-cache/blob/main/docs/operating-model.md#one-rule
[lychee]: https://github.com/lycheeverse/lychee#installation
<!-- prettier-ignore-end -->

## Community Guidelines

This project follows
[Google's Open Source Community Guidelines](https://opensource.google.com/conduct/).
