# Scout reports

Survey artifacts produced by the **Scout** role of agent teams (per the [agent-team-orchestration plan](https://github.com/fellwork/foreman/blob/main/agent-team-orchestration-plan.md)).

Scout reports inform the **Architect** role's spec output. They are kept on disk because:

- The reasoning behind a spec's decisions is often "Scout found X" — preserving the report makes those decisions auditable.
- External prior-art research costs ~10–15 minutes per spawn; recording it once avoids re-doing the work later.
- Risks and do-not-break lists captured during survey are forgotten as fast as the conversation moves on.

## Naming convention

`YYYY-MM-DD-<topic>-scout-report.md`

Where `<topic>` matches the corresponding spec name in `../specs/`. One scout report per spec.

## Contents

| Date | Topic | Spec it informed |
|---|---|---|
| 2026-04-26 | shared-configs tools roadmap | [2026-04-27-shared-configs-tools-roadmap.md](../specs/2026-04-27-shared-configs-tools-roadmap.md) |
