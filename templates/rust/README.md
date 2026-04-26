# Rust template configs

These files are copied into Rust workspaces by foreman during scaffold or `foreman adopt --kind=rust-workspace`.

## Files

| File | Purpose |
|---|---|
| `.cargo/config.toml` | Cargo build flags (denies warnings, sparse registry) |
| `clippy.toml` | Clippy MSRV + tuning |
| `rustfmt.toml` | rustfmt rules |
| `deny.toml` | cargo-deny license + advisory + source policy |
| `rust-toolchain.toml` | Pins rustc channel + required components |
| `.fw-domain-lint.toml` | Fellwork-specific domain lint rules (consumed by `fw-domain-lint` crate in fellwork/api) |

## `.fw-domain-lint.toml` distribution

Unlike the other Rust files which are copied once at scaffold time, this file is *also* fetched by fellwork/api's CI at lint time, pinned to a tag. This lets domain-lint rules propagate to api without re-scaffolding.

Consumer-side CI snippet (in `fellwork/api/.github/workflows/ci.yml`):

```yaml
- name: fetch shared domain-lint config
  run: |
    curl -sSL \
      https://raw.githubusercontent.com/fellwork/shared-configs/${DOMAIN_LINT_TAG}/templates/rust/.fw-domain-lint.toml \
      -o .fw-domain-lint.toml
  env:
    DOMAIN_LINT_TAG: 'domain-lint-v1'
```

The `domain-lint-v1` tag is bumped from this repo when rules change. Renovate's `github-actions` manager bumps the tag in consumer workflows automatically.

## Updates

For everything else (`clippy.toml`, `rustfmt.toml`, etc.), updates are pulled by `foreman sync`. See foreman's docs for the diff/merge model.
