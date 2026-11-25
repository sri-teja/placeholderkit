# Releasing

Versions are managed with [Changesets](https://github.com/changesets/changesets).

## Day to day

1. Make a change.
2. Run `npm run changeset`, pick patch / minor / major, and write one line for the changelog. This adds a file in `.changeset/`; commit it with the change.
3. Merge to `main`. Once releases are enabled (below), the Release workflow opens or updates a **Version Packages** PR that bumps `package.json` and writes `CHANGELOG.md`.
4. Merge the Version Packages PR to publish to npm (with provenance) and create a GitHub release and tag.

Changes that don't affect users (docs, CI, tests) don't need a changeset.

## First publish (by hand, once)

Done: 0.1.0 was published by hand on 2026-11-25, and 0.1.1 was the first release from the workflow. Kept for reference.

1. `npm login` (as the account that should own the package).
2. Create the `placeholderkit` npm org at npmjs.com/org/create so the `@placeholderkit` scope is reserved.
3. From a clean checkout of `main`: `npm publish --access public`. `prepublishOnly` runs typecheck, build and tests first.
4. On npmjs.com, open the package's **Settings > Trusted Publisher**, choose GitHub Actions, and enter the GitHub owner, repo `placeholderkit`, and workflow `release.yml`. No npm token is stored in GitHub.
5. In the GitHub repo: **Settings > Actions > General > Workflow permissions**, tick "Allow GitHub Actions to create and approve pull requests".
6. **Settings > Secrets and variables > Actions > Variables**: add `RELEASE_ENABLED` = `true`.

From then on every release goes through the Version Packages PR.

## Notes

- Tooling: `@changesets/cli` 3.x with `changesets/action` v2. Both need Node 22.11+ (and npm 10.9+) for local release commands.
- CI (`.github/workflows/ci.yml`) runs typecheck, build, tests and `npm pack --dry-run` on Node 22, 24 and 26 for every push to `main` and every PR. Supported Node versions follow the Node release schedule: active and maintenance LTS lines plus the current release.
