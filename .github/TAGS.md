# Major-version tags for reusable workflows

Reusable workflows in this repo are versioned via moving major-version git tags (`v1`, `v2`, …). Consumer repos reference a tag rather than a SHA so they get backward-compatible improvements automatically.

## Bumping the v1 tag

When workflow files in `.github/workflows/` or composite actions in `.github/actions/` change *backward-compatibly*:

```bash
git tag -fa v1 -m "v1 → moved to $(git rev-parse HEAD)"
git push origin v1 --force
```

## Cutting a new major (`v2`, `v3`, …)

When a workflow has a breaking input/output change:

```bash
git tag -a v2 -m "v2 cut at $(git rev-parse HEAD)"
git push origin v2
```

Then update `README.md` and `docs/workflows.md` with the migration notes. Consumers stay on `v1` until they opt in.

## Initial tag setup

After this plan's first deploy, run once:

```bash
git tag -a v1 -m "v1 initial"
git tag -a domain-lint-v1 -m "domain-lint-v1 initial"
git push origin v1 domain-lint-v1
```

The `domain-lint-v1` tag pins `templates/rust/.fw-domain-lint.toml`. It is bumped *separately* from `v1` because domain-lint rules change on a different cadence than CI workflow shape.
