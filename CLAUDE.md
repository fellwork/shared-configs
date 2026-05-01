# shared-configs

Canonical home for shared developer configs across the Fellwork ecosystem.

## Commands

```bash
bun install                # install dependencies
moon run :ci               # full CI pipeline (check + test)
bun run changeset          # add a changeset for the current change
bunx changeset status      # see what's queued for release
```

## Layout

- `packages/` — published @fellwork/* packages
- `templates/` — file-copy assets consumed by foreman
- `kinds/` — repo-type manifests (the integration keystone)
- `.github/workflows/` — reusable workflows consumed by ref
- `.github/actions/` — composite actions
- `tools/` — repo-shape verifier + kind-manifest validator
- `docs/superpowers/specs/` — design docs

## Conventions

- **Commits:** Conventional Commits per `@fellwork/commitlint-config`. Allowed types: add, breaking, build, chore, chore-deps, chore-release, ci, config, docs, feat, fix, i18n, perf, refactor, release, remove, revert, security, style, test.
- **Format / lint:** biome (formatter + core lints), oxlint (broad correctness sweep). The repo dogfoods @fellwork/biome-config from packages/biome-config.
- **TypeScript:** root tsconfig.json extends @fellwork/tsconfig/node.
- **Releases:** changesets-driven, npm trusted publishing (OIDC). No NPM_TOKEN secret. See docs/superpowers/specs/2026-04-26-fellwork-shared-configs-design.md §5.

## Skill routing

- Bugs, errors → `investigate`
- Ship, deploy, PR → `ship`
- Code review → `review`

## gstack

AI dev tooling — headless browser, QA, design review, deploy workflows.

**Install (one-time per machine):**
```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

Use `/browse` for all web browsing. Never use `mcp__claude-in-chrome__*` tools directly.

Available skills:
`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`

## Agent-Specific Notes

This repository includes a compiled documentation database/knowledgebase at `AGENTS.db`.
For context for any task, you MUST use MCP `agents_search` to look up context including architectural, API, and historical changes.
Treat `AGENTS.db` layers as immutable; avoid in-place mutation utilities unless required by the design.
