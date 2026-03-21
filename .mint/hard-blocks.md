# Hard Blocks — What Agents Can NEVER Do

Violations trigger immediate stop and escalation to user.

## Universal
- NEVER `git push` — human reviews and pushes manually
- NEVER modify files outside declared task scope
- NEVER delete or skip tests to make gates pass
- NEVER use `any` type or `@ts-ignore` to silence type errors
- NEVER disable lint rules to make gates pass
- NEVER commit with failing gates
- NEVER fix bad output directly — reset and fix the spec
- NEVER continue after 2 failures on the same spec
- NEVER mock internal modules — only mock external services

## Context Protection
- NEVER read large files in the main orchestrator context
- NEVER run tests or linters in the main orchestrator context
- Subagents return summaries only

## Project-Specific
- NEVER start long-running/persistent processes (dev, watch, serve, ngrok, docker compose up without -d) — these block the terminal
- NEVER use `any` type — use `unknown` at system boundaries
- NEVER use `function` keyword — arrow functions only
- NEVER use barrel files (no index.ts that re-exports everything)
- NEVER use namespace imports — specific imports only
- NEVER use `var` — `const` by default, `let` only when needed
