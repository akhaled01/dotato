# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Dotato is a multi-platform AI code review and codebase Q&A bot. It indexes codebases into a vector store, retrieves relevant context via RAG, and streams AI-generated reviews and answers into Slack, Discord, Teams, and GitHub.

### Tech Stack

- **Bot framework**: Vercel Chat SDK (`chat`) — unified multi-platform chatbot
- **HTTP server**: Hono
- **LLM layer**: Vercel AI SDK (`ai` + `@ai-sdk/deepseek`) + DeepSeek (V3.2 for bulk, reasoner for deep review)
- **Indexing/RAG**: LlamaIndex.TS (chunking, embeddings, retrieval, reranking)
- **Database**: PostgreSQL with pgvector (via Drizzle ORM)
- **Queue**: BullMQ (Redis-backed job queue for async indexing)
- **State**: Redis (Chat SDK thread subscriptions + BullMQ broker)
- **Monorepo**: Turborepo + pnpm workspaces

## Build Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build a specific app or package
pnpm --filter bot build
pnpm --filter indexer build
pnpm --filter @dotato/retrieval build

# Type-check everything
pnpm typecheck

# Lint and format
pnpm check
pnpm check --fix

# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @dotato/db test

# Dev mode (bot + indexer + watch)
pnpm dev

# Run only the bot in dev
pnpm --filter bot dev

# Run only the indexer worker in dev
pnpm --filter indexer dev

# Full validation — ALWAYS run before declaring a task done
pnpm validate
```

**NEVER run long-running/blocking processes** like `pnpm dev`, `pnpm --filter bot dev`, `pnpm --filter indexer dev`, `ngrok`, `docker compose up` (without `-d`), or anything that watches/serves indefinitely. These block the terminal and hang the session. Only run build, typecheck, lint, test, and other commands that terminate on their own.

## Architecture

```
dotato/
├── apps/
│   ├── bot/          # Chat SDK bot server (Hono + webhook handlers)
│   └── indexer/      # BullMQ worker (clones repos, chunks, embeds)
├── packages/
│   ├── retrieval/    # RAG pipeline (LlamaIndex.TS wiring)
│   ├── llm/          # Vercel AI SDK + DeepSeek client + prompt templates
│   ├── db/           # Drizzle ORM schema + pgvector queries
│   └── shared/       # Types, config, logger, queue setup
└── infra/            # Docker Compose, Dockerfiles
```

### Apps

**`apps/bot`** — The always-on process. Hono receives webhooks from Slack, Discord, Teams, GitHub. Chat SDK routes them to handlers. Handlers call the retrieval + LLM packages and stream/post responses back.

- `src/index.ts` — Hono server, Chat SDK setup, adapter registration
- `src/handlers/on-mention.ts` — Triggered on @mention. Routes to review or Q&A flow based on context (PR vs channel)
- `src/handlers/on-subscribed.ts` — Follow-up messages in subscribed threads
- `src/handlers/on-reaction.ts` — 👍/👎 feedback collection for review quality
- `src/prompts/review.ts` — PR review prompt templates with few-shot examples
- `src/prompts/qa.ts` — Codebase Q&A prompt templates

**`apps/indexer`** — Separate process. BullMQ worker that consumes indexing jobs. Does NOT handle HTTP — only processes jobs from the queue.

- `src/index.ts` — Worker entrypoint, BullMQ consumer setup
- `src/clone.ts` — Git clone/pull, file filtering (skip node_modules, lockfiles, binaries)
- `src/chunk.ts` — AST-aware code splitting via LlamaIndex.TS CodeSplitter (tree-sitter)
- `src/embed.ts` — Embedding generation + pgvector upsert
- `src/webhooks.ts` — GitHub push webhook handler (adds re-index jobs to queue)

### Packages

**`packages/retrieval`** — RAG pipeline. Thin wrapper around LlamaIndex.TS.

- `vector-store.ts` — PGVectorStore configuration
- `retriever.ts` — VectorStoreIndex + similarity search setup
- `reranker.ts` — CohereRerank postprocessor

**`packages/llm`** — LLM interaction via Vercel AI SDK (`@ai-sdk/deepseek`).

- `models.ts` — Model configuration (deepseek-chat for bulk, deepseek-reasoner for deep scan)
- `review.ts` — `streamText` / `generateText` for PR reviews
- `qa.ts` — `streamText` / `generateText` for codebase Q&A
- `structured.ts` — `generateObject` calls (query expansion, intent classification)

**`packages/db`** — Drizzle ORM + pgvector.

- `schema.ts` — Tables: repos, chunks, embeddings, feedback
- `client.ts` — Drizzle client + connection pool
- `migrate.ts` — Migration runner

**`packages/shared`** — Cross-cutting utilities.

- `types.ts` — Shared TypeScript types
- `config.ts` — Environment variable parsing and validation
- `logger.ts` — Structured logging
- `queue.ts` — BullMQ Queue/Worker connection factory

### Data Flow

1. **Indexing flow**: GitHub push webhook → Hono endpoint → BullMQ job → indexer worker → clone repo → chunk with tree-sitter → embed with embedding model → upsert into pgvector
2. **Query flow**: User @mentions bot → Chat SDK handler → query expansion (generateObject) → vector similarity search → rerank → context expansion → prompt assembly → streamText/generateText → response posted to platform
3. **Review flow**: Same as query flow but triggered on PR context. Uses review-specific prompts with few-shot examples from past reviews. GitHub gets generateText (no streaming), Slack/Discord/Teams get streamText.

### Platform Behavior

| Platform | Streaming | Method |
|----------|-----------|--------|
| Slack | Native streaming | `streamText` → `thread.streamPost()` |
| Discord | Post + edit | `streamText` → `thread.streamPost()` |
| Teams | Post + edit | `streamText` → `thread.streamPost()` |
| GitHub | No streaming | `generateText` → `thread.post()` |

Check `thread.adapter` to branch between streaming and non-streaming paths.

## Code Style

- ESM only (`"type": "module"` in all packages)
- TypeScript strict mode
- Use `const` by default, `let` only when needed, never `var`
- Prefer `async/await` over promise chains
- Use `unknown` over `any`
- Use `for...of` over `.forEach()`
- Arrow functions for everything — no `function` keyword. Use implicit returns where possible: `const add = (a: number, b: number) => a + b`
- Explicit return types on exported functions
- Early returns over nested conditionals
- Descriptive error messages — throw `Error` objects, not strings
- Code splitting: maintain a balance between clean separation and Locality of Behavior (LoB). Don't over-abstract into tiny files that scatter related logic — keep code that changes together close together. Split when a module genuinely serves multiple consumers or exceeds ~200 lines, not for the sake of "one function per file"

### Imports

- Use specific imports, not namespace imports
- No barrel files (no index.ts that re-exports everything from a package)
- Cross-package imports use workspace aliases: `@dotato/retrieval`, `@dotato/db`, etc.

### Naming

- Files: `kebab-case.ts`
- Types/interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Database columns: `snake_case` (Drizzle maps to camelCase in TS)

## Environment Variables

```bash
# LLM
DEEPSEEK_API_KEY=            # DeepSeek API key (OpenAI-compatible endpoint)
COHERE_API_KEY=              # Reranker API key (optional)

# Database
DATABASE_URL=                # PostgreSQL connection string (with pgvector)

# Redis
REDIS_URL=                   # Redis connection for BullMQ + Chat SDK state

# Slack
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=

# Discord
DISCORD_BOT_TOKEN=
DISCORD_PUBLIC_KEY=

# GitHub
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

# Teams (optional)
TEAMS_APP_ID=
TEAMS_APP_PASSWORD=

# Embeddings
OPENAI_API_KEY=              # For text-embedding-3-small (or swap provider)
```

## Local Development

```bash
# Start Postgres (pgvector) + Redis
docker compose up -d

# Run database migrations
pnpm --filter @dotato/db migrate

# Start bot + indexer in dev mode
pnpm dev
```

Use ngrok or similar to expose local Hono server for webhook testing:

```bash
ngrok http 3000
```

Then configure platform webhook URLs to point at your ngrok tunnel.

## Testing

- Tests live next to source files: `foo.ts` → `foo.test.ts`
- Use Vitest
- Mock external services (DeepSeek, Cohere, pgvector) in unit tests
- Integration tests for the full retrieval pipeline use a test Postgres instance with pgvector

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Single file
pnpm --filter @dotato/retrieval test src/retriever.test.ts
```

## Common Tasks

### Add a new repo to index

Queue an indexing job manually:

```ts
import { indexQueue } from "@dotato/shared/queue";
await indexQueue.add("index-repo", {
  repoUrl: "https://github.com/org/repo.git",
  branch: "refs/heads/main",
  changedFiles: [], // empty = full index
});
```

### Add a new prompt template

1. Create the template in `apps/bot/src/prompts/`
2. Wire it into the appropriate handler in `apps/bot/src/handlers/`
3. Use `streamText` or `generateText` from `@dotato/llm`

### Add a new platform adapter

1. Install the Chat SDK adapter: `pnpm --filter bot add @chat-adapter/{platform}`
2. Register it in `apps/bot/src/index.ts` under `adapters`
3. Add webhook route in Hono
4. Add platform env vars to `.env` and `config.ts`

### Modify the database schema

1. Edit `packages/db/src/schema.ts`
2. Generate migration: `pnpm --filter @dotato/db generate`
3. Run migration: `pnpm --filter @dotato/db migrate`

## Debugging

- Bot logs: structured JSON via `@dotato/shared/logger`
- BullMQ dashboard: use `bull-board` or check Redis directly
- Vector search quality: log retrieved chunks + similarity scores in retrieval package
- Prompt debugging: log assembled prompts before sending to LLM (redact in production)

## Key Decisions

- **Two separate processes** (bot + indexer) so webhook responses are never blocked by indexing work
- **BullMQ over in-process queues** because indexing can take minutes and needs retry/persistence
- **LlamaIndex.TS for RAG plumbing** instead of hand-rolling — chunking and retrieval are solved problems
- **Vercel AI SDK for LLM layer** — provider-agnostic, clean streaming, structured output with Zod
- **pgvector over dedicated vector DB** — fewer moving parts, Postgres is already in the stack
- **Drizzle over Prisma** — better TypeScript ergonomics, lighter, supports pgvector natively
- **deepseek-chat for bulk reviews, deepseek-reasoner for deep scan** — cost-effective with strong code reasoning; V4 swap planned when available