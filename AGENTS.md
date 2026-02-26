# AGENTS.md — ClipVault Developer Guide

> This file provides context for AI agents working on ClipVault

## Project Overview

ClipVault is a Discord bot that automatically delivers gaming highlights from Allstar.gg. When users link their gaming accounts (Steam for CS2/Dota2, Riot for League of Legends, Epic for Fortnite), the bot detects match completion, requests clip generation from Allstar Partner API, and delivers clips via Discord DM.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DISCORD LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │ Slash Cmds  │  │  DM Sender  │  │ Interaction Handler│  │
│  └─────────────┘  └─────────────┘  └────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    CORE SERVICES                            │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   User     │  │  Account   │  │      Match           │  │
│  │  Service   │  │  Service   │  │      Service         │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
│  ┌────────────┐  ┌────────────┐                            │
│  │   Clip     │  │  Delivery  │                            │
│  │  Service   │  │  Service   │                            │
│  └────────────┘  └────────────┘                            │
├─────────────────────────────────────────────────────────────┤
│                  PLATFORM INTEGRATIONS                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐   │
│  │  Steam  │  │  Riot   │  │  Epic   │  │   Allstar    │   │
│  │ Client  │  │ Client  │  │ Client  │  │    Client    │   │
│  └─────────┘  └─────────┘  └─────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    JOB SYSTEM (BullMQ)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐     │
│  │ Match Poll   │  │ Clip Request │  │ Clip Delivery │     │
│  │   Worker     │  │   Worker     │  │    Worker     │     │
│  └──────────────┘  └──────────────┘  └────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

- **Language**: TypeScript (Node.js runtime)
- **Discord Library**: discord.js v14
- **Database**: PostgreSQL via Prisma ORM
- **Cache/Queue**: Redis via BullMQ
- **Web Framework**: Fastify
- **Testing**: Vitest

## Key Directories

```
src/
├── config/           # Configuration management
├── db/               # Database (Prisma) and Redis clients
├── discord/          # Discord bot client, commands, embeds
├── integrations/      # Platform clients (Steam, Riot, Epic, Allstar)
├── jobs/             # BullMQ workers and queue definitions
├── services/         # Business logic (User, Account, Match, Clip, Delivery)
├── types/            # TypeScript types and enums
├── utils/            # Logger, errors, helpers
├── web/              # Fastify server for OAuth callbacks
└── index.ts          # Application entry point
```

## Development Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Build TypeScript
npm run build

# Start development
npm run dev
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in required API keys
3. Start Docker containers: `docker-compose up -d`
4. Run migrations: `npx prisma migrate dev`

## Testing Strategy

- Unit tests in `tests/unit/` mirroring `src/` structure
- 108 tests passing with ~65% code coverage
- Run tests before pushing: `npm test`

## Important Patterns

1. **Never call external APIs directly from commands** — always go through services
2. **Use BullMQ for all background jobs** — no setInterval
3. **Encrypt OAuth tokens at rest** — use encryption utilities
4. **Log everything** — use the logger from utils/logger.ts
5. **Update types when adding new data** — src/types/index.ts

## Critical Dependencies

- Allstar Partner API (requires onboarding)
- Steam Web API (requires API key)
- Riot Games API (requires API key)
- Discord Bot Token

## Common Tasks

### Adding a new service
1. Create `src/services/NewService.ts`
2. Export singleton instance
3. Add tests in `tests/unit/services/NewService.test.ts`
4. Add to exports in relevant index files

### Adding a new platform integration
1. Create `src/integrations/platform/PlatformClient.ts`
2. Implement required methods
3. Add tests in `tests/unit/integrations/`

### Adding a new job worker
1. Create `src/jobs/newJob.worker.ts`
2. Define job data type in `src/types/index.ts`
3. Add queue to `src/jobs/queue.ts`
4. Add tests

## Code Style

- Use TypeScript strict mode
- Prefer interfaces over types for public APIs
- Use enums for fixed values (PlatformType, MatchStatus, etc.)
- Keep functions under 50 lines
- Document public APIs with JSDoc

## Git Workflow

1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Ensure all tests pass
5. Commit with descriptive message
6. Push and create PR

## Contact

For questions about this codebase, refer to BLUEPRINT.md for full architectural details.
