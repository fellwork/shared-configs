# Contributing

Thanks for your interest in contributing.

## Workflow

1. Fork and create a feature branch off `main`.
2. Run `bun install` and ensure `moon run :ci` passes locally.
3. Add a [Conventional Commits](https://www.conventionalcommits.org/) message — see [@fellwork/commitlint-config](https://github.com/fellwork/shared-configs/tree/main/packages/commitlint-config) for the allowed types.
4. If your change affects a published package, run `bun run changeset` and pick the right bump.
5. Open a PR. CI must pass and one review approval is required.

## Local development

This repo uses [proto](https://moonrepo.dev/proto) to pin tool versions. Install proto, then `proto use` will install bun, node, and moon at the right versions.

## License

By contributing, you agree your contributions are licensed under MIT.
