# Knowledge Base Central

A centralized knowledge management platform designed to capture, organize, preserve, connect, and disseminate knowledge accumulated from academic study, research activities, professional experience, and personal learning.

The initial focus is consolidating knowledge acquired throughout a Master of Computer Science program. Over time, KBC will evolve into a comprehensive knowledge ecosystem representing concepts, relationships, references, learning paths, and domain expertise across multiple disciplines.

> **Mission:** Transform fragmented learning materials, research notes, academic knowledge, and professional experience into a coherent, searchable, interconnected, and continuously evolving knowledge system.

---

## Monorepo Structure

```
knowledge-base-central/
├── packages/
│   ├── api/          # Node.js + TypeScript Fastify backend
│   ├── web/          # Next.js 14 App Router frontend
│   └── shared/       # Shared TypeScript types and utilities
├── docker-compose.yml
├── docker-compose.override.yml   # Local developer overrides (not committed)
├── .env.example
├── tsconfig.base.json
├── turbo.json
└── package.json      # Workspace root (private)
```

---

## Prerequisites

- TODO: fill in required Node.js version
- TODO: fill in required pnpm version
- TODO: fill in Docker and Docker Compose version requirements

## Installation

```bash
# TODO: fill in installation steps
# Example:
# pnpm install
```

## Local Services (Docker)

Start the local development services (PostgreSQL 16, Redis 7):

```bash
docker compose up -d
```

This starts:

- **PostgreSQL** on port `5432` (data persisted in a named volume)
- **Redis** on port `6379`

To also start **MailHog** (local SMTP with web UI at `http://localhost:8025`):

```bash
docker compose --profile dev up -d
```

To stop all services:

```bash
docker compose down
```

For developer-specific overrides (custom ports, passwords, etc.), copy and edit the override file:

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
# edit docker-compose.override.yml as needed — it is git-ignored
```

## Environment Configuration

Copy the example env file and fill in the required values:

```bash
cp .env.example .env
```

> TODO: fill in which values are required for local development vs. optional

## Running Locally

```bash
# API (packages/api)
# TODO: fill in — expected: pnpm dev

# Web (packages/web)
# TODO: fill in — expected: pnpm dev
```

## Linting and Type Checking

```bash
# TODO: fill in — expected: pnpm lint
# TODO: fill in — expected: pnpm typecheck
```

## Testing

```bash
# TODO: fill in — expected: pnpm test
```

---

## CI

TODO: fill in CI provider and link to pipeline status badge.

---

## License

TODO: fill in license.
