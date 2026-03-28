# dotato

AI-powered code review and codebase Q&A bot. Indexes your repos into a vector store, retrieves relevant context via RAG, and streams reviews and answers into GitHub, Slack, Discord, and Teams.

## How it works

1. **Index** — point dotato at a repo. It clones it, chunks the code with AST-aware splitting, embeds each chunk, and stores everything in pgvector.
2. **Review** — install the GitHub App on a repo. On every PR, dotato retrieves relevant context, runs it through DeepSeek, and posts a structured review with severity ratings.
3. **Q&A** — @mention the bot anywhere. It expands your query, searches the vector store, and streams an answer back.

## Stack

| Layer | Tech |
|---|---|
| Bot framework | Vercel Chat SDK — unified multi-platform |
| HTTP | Hono |
| LLM | Vercel AI SDK + DeepSeek (V3 for bulk, reasoner for deep scan) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector store | PostgreSQL + pgvector |
| Queue | BullMQ (Redis) |
| ORM | Drizzle |
| Monorepo | Turborepo + pnpm workspaces |
| Runtime | Bun |

## Structure

```
dotato/
├── apps/
│   ├── bot/        # Webhook server — receives platform events, streams responses
│   ├── indexer/    # BullMQ worker — clones repos, chunks, embeds
│   └── cli/        # dotato CLI — index repos, inspect status
├── packages/
│   ├── retrieval/  # pgvector search
│   ├── llm/        # DeepSeek + prompt templates
│   ├── db/         # Drizzle schema + migrations
│   └── env/        # Typed environment variables
```

## Prerequisites

- Bun ≥ 1.1
- Docker (for Postgres + Redis)
- A GitHub App ([create one](https://github.com/settings/apps/new)) with webhook permissions
- DeepSeek API key
- OpenAI API key (embeddings only)

## Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/dotato
cd dotato
pnpm install

# 2. Copy env and fill in values
cp .env.example .env

# 3. Start Postgres (pgvector) + Redis
docker compose up -d

# 4. Run migrations
pnpm --filter @dotato/db migrate
```

## Development

```bash
# Start bot + indexer in watch mode
pnpm dev

# Bot only
pnpm --filter bot dev

# Indexer only
pnpm --filter indexer dev
```

Expose the bot for webhook delivery:

```bash
# ngrok is included in docker compose — tunnel opens automatically on port 4040
# Check http://localhost:4040 for your public URL, then set it as your GitHub App webhook URL
```

## CLI

Index any repo from its root:

```bash
# From inside a git repo — auto-detects origin URL and current branch
pnpm dlx dotato index

# Or specify explicitly
pnpm dlx dotato index https://github.com/org/repo --branch refs/heads/main

# List indexed repos
pnpm dlx dotato list

# Check indexing status
pnpm dlx dotato status https://github.com/org/repo
```

Requires a `.env` file in the current directory with `DATABASE_URL` and `REDIS_URL`.

## Commands

```bash
pnpm build          # Build all packages and apps
pnpm typecheck      # Type-check everything
pnpm check          # Lint + format (Biome)
pnpm check --fix    # Auto-fix lint/format issues
pnpm test           # Run all tests
pnpm validate       # Full validation — run before shipping
```

## Environment variables

See [`.env.example`](.env.example) for the full list.

Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL with pgvector |
| `REDIS_URL` | Redis for BullMQ + Chat SDK state |
| `DEEPSEEK_API_KEY` | LLM for reviews and Q&A |
| `OPENAI_API_KEY` | Embeddings (`text-embedding-3-small`) |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_PRIVATE_KEY` | GitHub App private key |
| `GITHUB_WEBHOOK_SECRET` | Webhook signature secret |
