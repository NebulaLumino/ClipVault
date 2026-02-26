# BLUEPRINT.md — ClipVault: Automatic Gaming Highlight Delivery Bot for Discord

> **Version**: 1.0.0-DRAFT
> **Last Updated**: 2025-02-25
> **Author**: Chief Software Architect
> **Status**: MVP Architecture Blueprint
> **Target**: Full Production-Deployable MVP

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Research Findings & Platform Intelligence](#2-research-findings--platform-intelligence)
3. [Product Vision & Requirements](#3-product-vision--requirements)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Repository Structure](#5-repository-structure)
6. [docs/ Folder — Mirror Documentation System](#6-docs-folder--mirror-documentation-system)
7. [Core Module Specifications](#7-core-module-specifications)
8. [Database Schema & Data Architecture](#8-database-schema--data-architecture)
9. [Allstar Partner API Integration Layer](#9-allstar-partner-api-integration-layer)
10. [Game Platform Account Linking System](#10-game-platform-account-linking-system)
11. [Match Detection & Polling Engine](#11-match-detection--polling-engine)
12. [Clip Orchestration Pipeline](#12-clip-orchestration-pipeline)
13. [Discord Delivery System](#13-discord-delivery-system)
14. [Discord Slash Command Interface](#14-discord-slash-command-interface)
15. [OAuth2 & Authentication Architecture](#15-oauth2--authentication-architecture)
16. [Web Dashboard (Account Linking Portal)](#16-web-dashboard-account-linking-portal)
17. [Rate Limiting & Queue Management](#17-rate-limiting--queue-management)
18. [Error Handling & Resilience Patterns](#18-error-handling--resilience-patterns)
19. [Logging, Monitoring & Observability](#19-logging-monitoring--observability)
20. [Configuration & Environment Management](#20-configuration--environment-management)
21. [Deployment Architecture](#21-deployment-architecture)
22. [Testing Strategy](#22-testing-strategy)
23. [AI Agent Workflow & Documentation Protocol](#23-ai-agent-workflow--documentation-protocol)
24. [AGENTS.md Specification](#24-agentsmd-specification)
25. [CLAUDE.md Specification](#25-claudemd-specification)
26. [API.md Specification](#26-apimd-specification)
27. [Security Considerations](#27-security-considerations)
28. [Scalability Roadmap](#28-scalability-roadmap)
29. [Phase-by-Phase Implementation Plan](#29-phase-by-phase-implementation-plan)
30. [Appendix: Critical Decisions & Rationale](#30-appendix-critical-decisions--rationale)

---

## 1. EXECUTIVE SUMMARY

### 1.1 What We Are Building

ClipVault is a Discord bot that acts as an **automatic gaming highlight delivery system**. When a user finishes a game, ClipVault automatically detects the match completion, requests clip generation from the Allstar.gg Partner API, monitors clip processing, and delivers every relevant clip (kills, deaths, assists, aces, clutches, Play of the Game — everything Allstar generates for that player in that match) directly to the user via Discord DM.

### 1.2 The Core Loop

```
User finishes a game
       ↓
Match Detection Engine detects match completion (polling)
       ↓
Clip Orchestrator requests clips from Allstar Partner API
       ↓
Clip Monitor polls for clip processing completion (~5-30 min)
       ↓
Discord Delivery System DMs user with all clips
       ↓
User receives video files (if small enough) or links
```

### 1.3 Why Allstar.gg

Allstar.gg is the industry-leading cloud-based gaming clip generation platform. It processes game replay files (demos) server-side — no screen recording, no FPS drops, no client software required. They currently support **Counter-Strike 2, League of Legends, Fortnite, and Dota 2**. Their Partner API is free, covers hosting costs, and is designed for exactly this type of integration. Major partners include Leetify, FACEIT, Overwolf, Tracker Network (TRN), U.GG, Facecheck, HLTV, Buff, and Refrag.

### 1.4 Key Technical Decisions

- **Language**: TypeScript (Node.js runtime)
- **Discord Library**: discord.js v14
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache/Queue**: Redis (via BullMQ for job queues)
- **Web Framework**: Fastify (for OAuth callbacks and webhook endpoints)
- **Deployment**: Docker containers on a VPS (Railway, Fly.io, or DigitalOcean)
- **Architecture Pattern**: Modular monolith with clear service boundaries (ready for future microservice extraction)

---

## 2. RESEARCH FINDINGS & PLATFORM INTELLIGENCE

### 2.1 Allstar.gg — Verified Facts

**Supported Games (Confirmed via status.allstar.gg and help.allstar.gg):**

| Game | Platform(s) | Account ID Type | Match Detection Method |
|------|------------|-----------------|----------------------|
| Counter-Strike 2 | Steam, FACEIT | Steam64 ID + Share Codes | Valve Match API polling via Steam Web API |
| League of Legends | Riot Games | Riot PUUID + Region | Riot Match-V5 API polling |
| Dota 2 | Steam | Steam64 ID | Steam/OpenDota API polling |
| Fortnite | Epic Games | Epic Account ID | Fortnite-API / Epic Stats polling |

**Allstar Partner API — Verified Technical Details (from partners.allstar.gg):**

- Base URL: HTTPS only (HTTP redirects to HTTPS with 301)
- Auth: API Key-based (obtained through partner onboarding)
- Format: JSON request/response
- Rate Limits: Per-key basis, 429 status on exceed
- Verbs: Standard REST (GET, POST, PUT, DELETE)
- Webhooks: Available for selected partners (not guaranteed for all)
- Partner Portal: partnerportal.allstar.gg (iFrame viewer tool)
- Developer Portal: developer.allstar.gg (apply for access)
- Status Page: status.allstar.gg

**Allstar Connected Account Types (from allstar.gg/connectedaccounts):**

- Steam (primary for CS2, Dota 2)
- Riot Games (for League of Legends)
- Epic Games (for Fortnite)
- Discord (for identity linking)
- FACEIT (for CS2 third-party matches)

**Clip Processing Characteristics:**

- CS2 clips: ~30 minutes processing time
- Clip URL format: `allstar.gg/clip?clip={clipId}`
- iFrame embed: `allstar.gg/iframe?clip={clipId}`
- Partner claim URL: `allstar.gg/partner/claim/{partnerName}?steamid64={steamId}`
- Video format: MP4
- Clip categories: Highlights, Play of the Game, Moments (per-round selectable)
- CS2 supported modes: Competitive, Wingman only (no casual/DM)

**Allstar's Existing Discord Bot (AllstarBot):**

- Application ID: 580572502288498700
- Uses /create slash command for manual clip creation from match history
- Requires Allstar account linked to Discord
- Our bot is DIFFERENT — we are a Partner API integration that automates delivery, not a wrapper around AllstarBot

**How Leetify Integration Works (Reference Architecture):**

Leetify identifies a player's best rounds, sends highlight requests to Allstar via Partner API, Allstar processes the demo and generates clips, Leetify embeds clips in their product. Clips are stored on Allstar's infrastructure. If user links Allstar account, clips transfer to personal profile. Without linking, Allstar stores up to 10 clips per user with 30-day expiry.

### 2.2 Riot Games API — Key Facts

- Match-V5 API: `/lol/match/v5/matches/by-puuid/{puuid}/ids` for match list
- Active Game: `/lol/spectator/v5/active-games/by-summoner/{encryptedPUUID}` for live detection
- Routing: Regional routing (americas, europe, asia, sea for match data; platform-specific for live data)
- Rate Limits: 20 requests per 1 second, 100 requests per 2 minutes (personal key)
- Production keys have higher limits, applied via developer.riotgames.com
- PUUID is the universal player identifier across all Riot titles
- No native webhook for match completion — must poll

### 2.3 Steam Web API — Key Facts

- ISteamUser: Player summaries by Steam64 ID
- CS2 Match History: Available via Valve's GCPD (Game Coordinator Personal Data) endpoints
- Share Codes: Required for CS2 match history access alongside Steam auth token
- Dota 2: Match history via `/IDOTA2Match_570/GetMatchHistory/`
- OpenDota API: Free alternative with match details, no key required for basic endpoints
- No native webhook for match completion — must poll

### 2.4 Epic Games / Fortnite API — Key Facts

- FortniteTracker API or unofficial Fortnite-API.com for stats
- Epic Games does not provide an official public match history API
- Fortnite Replay system exists but is client-side
- Match detection strategy: Monitor player stats changes (kills/wins count changes indicate match completion)
- This is the LEAST mature integration path — document as "beta" in MVP

### 2.5 Discord API / discord.js v14 — Key Facts

- DM sending: `user.send()` method, rate limited
- File attachments: Up to 25MB for regular bots (50MB with Nitro boosted servers not applicable to DMs)
- Embed limit: 10 embeds per message
- Slash Commands: Registered via REST API or discord.js builders
- Button/Select Menu interactions for user preferences
- Gateway Intents needed: Guilds, GuildMembers (privileged), DirectMessages

---

## 3. PRODUCT VISION & REQUIREMENTS

### 3.1 User Stories

**US-01: Account Linking**
> As a gamer, I want to link my Steam/Riot/Epic account to the Discord bot so it knows which games to track for me.

**US-02: Automatic Match Detection**
> As a gamer, after I finish a competitive match, I want the bot to automatically know I just played a game without me doing anything.

**US-03: Automatic Clip Generation**
> As a gamer, I want every notable moment from my game (kills, deaths, assists, aces, clutches, POTG) to be automatically turned into video clips.

**US-04: Automatic DM Delivery**
> As a gamer, I want all clips from my match delivered to me via Discord DM automatically, with no action on my part.

**US-05: Smart Delivery Format**
> As a gamer, I want video files sent directly if they're small enough, and links if they're too large for Discord.

**US-06: Preferences**
> As a gamer, I want to control which games I'm tracked for, what types of clips I receive, and whether I receive DMs at all.

**US-07: Match Summary**
> As a gamer, I want a summary embed accompanying my clips that shows my match stats (K/D/A, result, map, etc.)

**US-08: Multi-Account Support**
> As a gamer, I want to link multiple Steam accounts or a Steam account AND a Riot account simultaneously.

**US-09: Server Feed (Stretch)**
> As a server admin, I want an optional channel where all members' highlights are posted (opt-in per user).

### 3.2 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Users link gaming accounts via OAuth2 flows initiated by Discord slash commands | P0 |
| FR-02 | System polls for new match completions per registered user, per game | P0 |
| FR-03 | System requests clip generation from Allstar Partner API for each detected match | P0 |
| FR-04 | System monitors clip processing status until all clips are ready | P0 |
| FR-05 | System delivers clips via Discord DM to the user | P0 |
| FR-06 | If clip video file < 25MB, attach as file; otherwise send Allstar URL | P0 |
| FR-07 | Delivery includes rich embed with match summary (game, map, score, K/D/A) | P1 |
| FR-08 | Users can configure notification preferences (game toggles, clip types, DM on/off) | P1 |
| FR-09 | Users can unlink accounts via slash command | P1 |
| FR-10 | System respects all API rate limits (Allstar, Riot, Steam, Discord) | P0 |
| FR-11 | System handles Allstar webhook events when available (fallback to polling) | P1 |
| FR-12 | Server admins can configure a highlight feed channel | P2 |
| FR-13 | System provides /status command showing linked accounts and pending clips | P1 |
| FR-14 | System provides /history command showing recent clip deliveries | P2 |

### 3.3 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Match detection latency | < 5 minutes after match ends |
| NFR-02 | Clip delivery latency | < 5 minutes after Allstar finishes processing |
| NFR-03 | System uptime | 99.5% |
| NFR-04 | Concurrent tracked users | 10,000+ |
| NFR-05 | Database response time | < 100ms p95 |
| NFR-06 | Memory usage per process | < 512MB |
| NFR-07 | Graceful degradation | If Allstar is down, queue requests and retry |
| NFR-08 | Data retention | Match/clip metadata 90 days, user data indefinite |

---

## 4. SYSTEM ARCHITECTURE OVERVIEW

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DISCORD LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │ Slash Cmds  │  │  DM Sender  │  │ Interaction Handler│  │
│  └──────┬──────┘  └──────┬──────┘  └─────────┬──────────┘  │
│         │                │                    │             │
├─────────┼────────────────┼────────────────────┼─────────────┤
│         │         CORE SERVICES               │             │
│  ┌──────▼──────────────────────────────────────▼──────────┐  │
│  │                  Command Router                        │  │
│  └──────┬───────────────┬──────────────────┬─────────────┘  │
│         │               │                  │                │
│  ┌──────▼──────┐ ┌──────▼──────┐ ┌────────▼─────────┐     │
│  │  Account    │ │ Preferences │ │   Status/History  │     │
│  │  Linker     │ │  Manager    │ │    Service        │     │
│  └──────┬──────┘ └─────────────┘ └──────────────────┘     │
│         │                                                   │
├─────────┼───────────────────────────────────────────────────┤
│         │         PIPELINE LAYER                            │
│  ┌──────▼──────────────────────────────────────────────┐    │
│  │              Match Detection Engine                  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐  │    │
│  │  │ CS2 Poll │ │ LoL Poll │ │D2 Poll │ │ FN Poll │  │    │
│  │  └────┬─────┘ └────┬─────┘ └───┬────┘ └────┬────┘  │    │
│  │       └─────────────┼───────────┼───────────┘       │    │
│  └─────────────────────┼───────────┼───────────────────┘    │
│                        │           │                        │
│  ┌─────────────────────▼───────────▼───────────────────┐    │
│  │              Clip Orchestrator                       │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐  │    │
│  │  │ Clip Request │ │ Clip Monitor │ │ Clip Fetcher│  │    │
│  │  └──────────────┘ └──────────────┘ └─────────────┘  │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                             │                               │
│  ┌──────────────────────────▼──────────────────────────┐    │
│  │              Delivery Engine                         │    │
│  │  ┌──────────┐ ┌──────────────┐ ┌────────────────┐   │    │
│  │  │ Formatter│ │ DM Dispatcher│ │ Channel Poster │   │    │
│  │  └──────────┘ └──────────────┘ └────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                       │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐    │
│  │PostgreSQL│ │  Redis  │ │  BullMQ  │ │  Fastify Web │    │
│  │(Prisma)  │ │ (Cache) │ │ (Queues) │ │  (OAuth/WH)  │    │
│  └─────────┘ └─────────┘ └──────────┘ └──────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   EXTERNAL APIs                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Allstar  │ │ Riot API │ │Steam API │ │ Epic/FN API  │  │
│  │Partner AP│ │          │ │          │ │              │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow — Complete User Journey

**Phase 1: Onboarding**
1. User adds bot to server or discovers it
2. User runs `/link steam` slash command
3. Bot responds with ephemeral message containing OAuth2 link to our web portal
4. Web portal initiates Steam OpenID auth
5. On callback, web portal stores Steam64 ID → Discord User ID mapping
6. Web portal also registers user with Allstar Partner API (creates partner user)
7. Bot confirms link via DM: "Steam account linked! I'll now track your CS2 and Dota 2 matches."

**Phase 2: Match Detection (Background)**
1. BullMQ repeatable job runs every 60-90 seconds per batch of users
2. For each user-game pair, the appropriate poller checks for new matches
3. CS2 poller: Calls Steam Web API for recent match history, compares against last known match ID stored in DB
4. LoL poller: Calls Riot Match-V5 API with `startTime` filter, compares against last known match
5. When new match detected: Creates a MatchRecord in DB with status `DETECTED`
6. Enqueues a `clip-request` job in BullMQ

**Phase 3: Clip Generation Request**
1. `clip-request` worker picks up job
2. Calls Allstar Partner API to request clip generation for: (game, user's platform ID, match identifier)
3. Allstar returns a request acknowledgment (or clip request ID)
4. Updates MatchRecord status to `CLIPS_REQUESTED`
5. Enqueues a `clip-monitor` job with appropriate delay (15 minutes for CS2, varies by game)

**Phase 4: Clip Monitoring**
1. `clip-monitor` worker picks up job after delay
2. Polls Allstar Partner API for clip status/results
3. If clips not ready: Re-enqueues with exponential backoff (15min → 20min → 30min → 45min → 60min)
4. If clips ready: Fetches all clip metadata (URLs, types, thumbnails)
5. Updates MatchRecord status to `CLIPS_READY`, stores clip metadata
6. Enqueues a `clip-deliver` job

**Phase 5: Delivery**
1. `clip-deliver` worker picks up job
2. Fetches user preferences (what clip types they want, DM enabled?)
3. Filters clips based on preferences
4. For each clip: Checks video file size
5. If < 25MB: Downloads MP4, attaches to Discord DM message
6. If ≥ 25MB: Sends embed with Allstar clip URL and thumbnail
7. Builds a summary embed with match stats (K/D/A, result, map, duration)
8. Sends DM to user with summary embed + all clip attachments/links
9. Updates MatchRecord status to `DELIVERED`
10. If server feed channel configured and user opted in: Also posts highlight(s) to channel

### 4.3 Process Architecture

```
┌─────────────────────────────────────┐
│          Main Process               │
│  ┌──────────────────────────────┐   │
│  │  Discord.js Client (Gateway) │   │
│  │  - Receives interactions     │   │
│  │  - Sends DMs                 │   │
│  │  - Manages presence          │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  Fastify HTTP Server         │   │
│  │  - OAuth2 callbacks          │   │
│  │  - Allstar webhook receiver  │   │
│  │  - Health check endpoint     │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  BullMQ Workers              │   │
│  │  - match-detection (cron)    │   │
│  │  - clip-request              │   │
│  │  - clip-monitor              │   │
│  │  - clip-deliver              │   │
│  │  - account-sync              │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

All run in a single Node.js process for MVP simplicity. Workers are BullMQ processors running in the same event loop. This works because all operations are I/O-bound (HTTP requests, DB queries), not CPU-bound.

---

## 5. REPOSITORY STRUCTURE

```
clipvault/
├── BLUEPRINT.md                    ← You are here (this document)
├── AGENTS.md                       ← AI agent instructions and patterns
├── CLAUDE.md                       ← Claude Code-specific project context
├── API.md                          ← API reference for all integrations
├── README.md                       ← Project overview and setup
├── LICENSE
├── .env.example                    ← Template for environment variables
├── .gitignore
├── docker-compose.yml              ← Local dev: PostgreSQL + Redis
├── Dockerfile                      ← Production container image
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma               ← Database schema definition
│   └── migrations/                 ← Migration files (auto-generated)
│
├── src/
│   ├── index.ts                    ← Application entry point
│   ├── config/
│   │   ├── index.ts                ← Config loader (env vars → typed config)
│   │   ├── constants.ts            ← Application-wide constants
│   │   └── games.ts                ← Game definitions and metadata
│   │
│   ├── core/
│   │   ├── discord/
│   │   │   ├── client.ts           ← Discord.js client setup
│   │   │   ├── events/
│   │   │   │   ├── ready.ts
│   │   │   │   ├── interactionCreate.ts
│   │   │   │   └── guildCreate.ts
│   │   │   ├── commands/
│   │   │   │   ├── index.ts        ← Command registry & deployer
│   │   │   │   ├── link.ts         ← /link [platform] command
│   │   │   │   ├── unlink.ts       ← /unlink [platform] command
│   │   │   │   ├── settings.ts     ← /settings command (preferences)
│   │   │   │   ├── status.ts       ← /status command (account info)
│   │   │   │   ├── history.ts      ← /history command (recent clips)
│   │   │   │   ├── setup.ts        ← /setup command (server admin)
│   │   │   │   └── help.ts         ← /help command
│   │   │   ├── components/
│   │   │   │   ├── buttons.ts      ← Button interaction handlers
│   │   │   │   └── selectMenus.ts  ← Select menu handlers
│   │   │   └── embeds/
│   │   │       ├── matchSummary.ts ← Match summary embed builder
│   │   │       ├── clipCard.ts     ← Individual clip embed builder
│   │   │       ├── accountInfo.ts  ← Account status embed builder
│   │   │       └── onboarding.ts   ← Welcome/help embeds
│   │   │
│   │   └── web/
│   │       ├── server.ts           ← Fastify server setup
│   │       ├── routes/
│   │       │   ├── auth/
│   │       │   │   ├── steam.ts    ← Steam OpenID callback
│   │       │   │   ├── riot.ts     ← Riot OAuth2 callback
│   │       │   │   ├── epic.ts     ← Epic OAuth2 callback
│   │       │   │   └── discord.ts  ← Discord OAuth2 (for web dashboard)
│   │       │   ├── webhooks/
│   │       │   │   └── allstar.ts  ← Allstar webhook receiver
│   │       │   └── health.ts       ← Health check endpoint
│   │       └── middleware/
│   │           ├── auth.ts         ← Request authentication
│   │           └── rateLimit.ts    ← Web endpoint rate limiting
│   │
│   ├── services/
│   │   ├── account/
│   │   │   ├── AccountLinkService.ts     ← Link/unlink gaming accounts
│   │   │   ├── AccountSyncService.ts     ← Sync account data with Allstar
│   │   │   └── AccountValidationService.ts ← Validate platform credentials
│   │   │
│   │   ├── match/
│   │   │   ├── MatchDetectionService.ts  ← Orchestrates all game pollers
│   │   │   ├── pollers/
│   │   │   │   ├── BasePoller.ts         ← Abstract base poller class
│   │   │   │   ├── CS2Poller.ts          ← CS2 match detection
│   │   │   │   ├── LoLPoller.ts          ← League of Legends match detection
│   │   │   │   ├── Dota2Poller.ts        ← Dota 2 match detection
│   │   │   │   └── FortnitePoller.ts     ← Fortnite match detection
│   │   │   └── MatchRecordService.ts     ← CRUD for match records
│   │   │
│   │   ├── clip/
│   │   │   ├── ClipOrchestrator.ts       ← Main clip pipeline coordinator
│   │   │   ├── ClipRequestService.ts     ← Send clip requests to Allstar
│   │   │   ├── ClipMonitorService.ts     ← Poll/receive clip status
│   │   │   ├── ClipFetchService.ts       ← Download/resolve clip assets
│   │   │   └── ClipFilterService.ts      ← Filter clips by user prefs
│   │   │
│   │   ├── delivery/
│   │   │   ├── DeliveryEngine.ts         ← Coordinates DM delivery
│   │   │   ├── MessageFormatter.ts       ← Builds Discord messages/embeds
│   │   │   ├── DMDispatcher.ts           ← Sends DMs with retry logic
│   │   │   └── ChannelPoster.ts          ← Posts to server feed channels
│   │   │
│   │   └── preferences/
│   │       ├── PreferenceService.ts      ← User preference CRUD
│   │       └── defaults.ts               ← Default preference values
│   │
│   ├── integrations/
│   │   ├── allstar/
│   │   │   ├── AllstarClient.ts          ← HTTP client for Allstar Partner API
│   │   │   ├── AllstarTypes.ts           ← TypeScript types for Allstar API
│   │   │   ├── AllstarWebhookHandler.ts  ← Process incoming webhooks
│   │   │   └── AllstarErrors.ts          ← Custom error classes
│   │   │
│   │   ├── steam/
│   │   │   ├── SteamClient.ts            ← Steam Web API client
│   │   │   ├── SteamTypes.ts             ← TypeScript types
│   │   │   └── SteamAuth.ts              ← Steam OpenID helpers
│   │   │
│   │   ├── riot/
│   │   │   ├── RiotClient.ts             ← Riot Games API client
│   │   │   ├── RiotTypes.ts              ← TypeScript types
│   │   │   └── RiotAuth.ts               ← Riot OAuth2 (RSO) helpers
│   │   │
│   │   ├── epic/
│   │   │   ├── EpicClient.ts             ← Epic/Fortnite API client
│   │   │   ├── EpicTypes.ts              ← TypeScript types
│   │   │   └── EpicAuth.ts               ← Epic OAuth2 helpers
│   │   │
│   │   └── opendota/
│   │       ├── OpenDotaClient.ts         ← OpenDota API client (Dota 2 fallback)
│   │       └── OpenDotaTypes.ts          ← TypeScript types
│   │
│   ├── jobs/
│   │   ├── queue.ts                      ← BullMQ queue definitions
│   │   ├── workers/
│   │   │   ├── matchDetection.worker.ts  ← Repeatable match polling worker
│   │   │   ├── clipRequest.worker.ts     ← Clip request processing worker
│   │   │   ├── clipMonitor.worker.ts     ← Clip status monitoring worker
│   │   │   ├── clipDeliver.worker.ts     ← Clip delivery worker
│   │   │   └── accountSync.worker.ts     ← Account data sync worker
│   │   └── schedulers/
│   │       └── matchPollScheduler.ts     ← Schedules per-user poll jobs
│   │
│   ├── database/
│   │   ├── prisma.ts                     ← Prisma client singleton
│   │   └── repositories/
│   │       ├── UserRepository.ts         ← User data access
│   │       ├── LinkedAccountRepository.ts ← Linked account data access
│   │       ├── MatchRepository.ts        ← Match record data access
│   │       ├── ClipRepository.ts         ← Clip metadata data access
│   │       ├── DeliveryRepository.ts     ← Delivery log data access
│   │       ├── PreferenceRepository.ts   ← User preferences data access
│   │       └── GuildConfigRepository.ts  ← Server configuration data access
│   │
│   └── utils/
│       ├── logger.ts                     ← Structured logger (pino)
│       ├── errors.ts                     ← Custom error hierarchy
│       ├── retry.ts                      ← Retry utilities with backoff
│       ├── rateLimit.ts                  ← Rate limiter utility
│       ├── steamId.ts                    ← Steam ID conversion utilities
│       ├── crypto.ts                     ← Encryption for stored tokens
│       ├── time.ts                       ← Time/duration helpers
│       └── validation.ts                ← Input validation helpers
│
├── docs/
│   ├── README.md                         ← Documentation index
│   ├── architecture/
│   │   ├── overview.md                   ← System architecture (mirrors §4)
│   │   ├── data-flow.md                  ← Complete data flow diagrams
│   │   └── decisions.md                  ← Architecture Decision Records
│   │
│   ├── modules/
│   │   ├── discord-client.md             ← src/core/discord/ documentation
│   │   ├── web-server.md                 ← src/core/web/ documentation
│   │   ├── account-service.md            ← src/services/account/ documentation
│   │   ├── match-detection.md            ← src/services/match/ documentation
│   │   ├── clip-orchestration.md         ← src/services/clip/ documentation
│   │   ├── delivery-engine.md            ← src/services/delivery/ documentation
│   │   ├── preferences.md               ← src/services/preferences/ documentation
│   │   ├── allstar-integration.md        ← src/integrations/allstar/ documentation
│   │   ├── steam-integration.md          ← src/integrations/steam/ documentation
│   │   ├── riot-integration.md           ← src/integrations/riot/ documentation
│   │   ├── epic-integration.md           ← src/integrations/epic/ documentation
│   │   └── job-system.md                 ← src/jobs/ documentation
│   │
│   ├── database/
│   │   ├── schema.md                     ← Database schema documentation
│   │   ├── migrations.md                 ← Migration strategy
│   │   └── queries.md                    ← Common query patterns
│   │
│   ├── api/
│   │   ├── allstar-partner-api.md        ← Allstar API reference
│   │   ├── steam-api.md                  ← Steam API reference
│   │   ├── riot-api.md                   ← Riot API reference
│   │   ├── epic-api.md                   ← Epic API reference
│   │   └── discord-api-notes.md          ← Discord-specific patterns
│   │
│   └── guides/
│       ├── setup.md                      ← Local development setup
│       ├── deployment.md                 ← Production deployment guide
│       ├── adding-a-game.md              ← How to add support for a new game
│       └── troubleshooting.md            ← Common issues and solutions
│
├── scripts/
│   ├── deploy-commands.ts                ← Register slash commands with Discord
│   ├── seed-db.ts                        ← Seed database with test data
│   └── test-allstar.ts                   ← Test Allstar API connectivity
│
└── tests/
    ├── unit/
    │   ├── services/
    │   ├── integrations/
    │   └── utils/
    ├── integration/
    │   ├── allstar.test.ts
    │   ├── match-detection.test.ts
    │   └── delivery.test.ts
    └── e2e/
        └── full-pipeline.test.ts
```

---

## 6. DOCS/ FOLDER — MIRROR DOCUMENTATION SYSTEM

### 6.1 Purpose

The `docs/` folder exists as a **mirror of the source code structure** designed specifically for AI agents (Claude Code, Codex) to gain rapid context without reading the entire codebase. Every module in `src/` has a corresponding documentation file in `docs/modules/` that describes:

1. **What the module does** (purpose, responsibility)
2. **How it wires to other modules** (dependencies, data flow)
3. **Key interfaces and types** (the "contract" it exposes)
4. **Logic walkthrough** (step-by-step pseudocode of critical paths)
5. **Edge cases and error handling** (what can go wrong)
6. **Examples** (input → output examples for key functions)

### 6.2 Documentation Update Protocol

**CRITICAL RULE: Every time code is written, modified, or refactored, the corresponding docs/ file MUST be updated in the same commit.** This is non-negotiable.

The AI agent performing implementation must:
1. Before writing code: Read the relevant `docs/modules/*.md` file to understand intent
2. After writing code: Update the docs file to reflect what was actually implemented
3. If behavior differs from the blueprint: Document the deviation and the reason
4. If new files are created: Create a corresponding docs entry

### 6.3 docs/modules/ File Template

Every file in `docs/modules/` must follow this template:

```markdown
# Module: [Name]

## Source Location
`src/[path]/[file].ts`

## Purpose
[One paragraph explaining what this module does and why it exists]

## Dependencies
- [module-name] — [why it depends on this]
- [module-name] — [why it depends on this]

## Exposes
- [FunctionOrClass] — [brief description]
- [FunctionOrClass] — [brief description]

## Data Flow
[Diagram or step-by-step description of how data moves through this module]

## Key Logic
### [Operation Name]
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Error Handling
- [Error condition] → [How it's handled]
- [Error condition] → [How it's handled]

## Examples
### [Scenario]
Input: [describe]
Output: [describe]

## Notes for AI Agents
[Special instructions, gotchas, things to watch out for]
```

---

## 7. CORE MODULE SPECIFICATIONS

### 7.1 Entry Point — src/index.ts

**Responsibility**: Bootstrap all systems in the correct order.

**Boot Sequence**:
1. Load and validate configuration (fail fast if required env vars missing)
2. Initialize Prisma client and verify database connectivity
3. Initialize Redis connection and verify connectivity
4. Initialize Fastify web server (register routes, start listening)
5. Initialize Discord.js client (login, wait for ready event)
6. Register slash commands with Discord API (if DEPLOY_COMMANDS flag is set)
7. Initialize BullMQ queues and workers
8. Start the match poll scheduler
9. Log "ClipVault ready" with startup metrics

**Shutdown Sequence** (on SIGINT/SIGTERM):
1. Stop accepting new Discord interactions
2. Pause all BullMQ workers (let active jobs finish, up to 30 second grace)
3. Close Fastify server
4. Disconnect Discord client
5. Disconnect Redis
6. Disconnect Prisma
7. Exit process

### 7.2 Configuration — src/config/

**src/config/index.ts**:
- Uses a typed configuration object, loaded from process.env
- Every config value has a type, a validation rule, and a default (where appropriate)
- Required values without defaults cause immediate process exit with descriptive error
- Config is frozen after loading (Object.freeze) to prevent runtime modification

**Key Config Sections**:
```
config.discord.token           — Bot token
config.discord.clientId        — Application ID
config.discord.clientSecret    — OAuth2 client secret (for web dashboard)
config.allstar.apiKey          — Partner API key
config.allstar.baseUrl         — Partner API base URL
config.allstar.webhookSecret   — Webhook verification secret
config.steam.apiKey            — Steam Web API key
config.riot.apiKey             — Riot Games API key
config.epic.clientId           — Epic OAuth2 client ID
config.epic.clientSecret       — Epic OAuth2 client secret
config.database.url            — PostgreSQL connection string
config.redis.url               — Redis connection string
config.web.port                — Fastify listen port
config.web.baseUrl             — Public-facing URL (for OAuth callbacks)
config.web.sessionSecret       — Session signing secret
config.polling.intervalMs      — Default poll interval (milliseconds)
config.polling.batchSize       — Users per poll batch
config.encryption.key          — 256-bit key for encrypting stored tokens
```

**src/config/games.ts**:
- Defines a `GameDefinition` type containing:
  - `id`: Enum value (CS2, LOL, DOTA2, FORTNITE)
  - `name`: Display name
  - `allstarGameId`: Allstar's internal game identifier
  - `platforms`: Which platforms this game uses (steam, riot, epic)
  - `pollerClass`: Reference to the poller class for this game
  - `clipProcessingTimeMs`: Expected clip processing time
  - `supportedModes`: Which game modes Allstar supports (e.g., Competitive, Wingman for CS2)
  - `requiredAccountFields`: What the user needs to provide (e.g., steam64id + shareCodes for CS2)
  - `enabled`: Boolean flag for easy feature flagging

**src/config/constants.ts**:
- Discord file size limits, embed color codes, retry counts, backoff parameters
- Allstar clip URL templates
- API endpoint paths

---

## 8. DATABASE SCHEMA & DATA ARCHITECTURE

### 8.1 Schema Overview (Prisma)

```prisma
// =============================================
// USER & ACCOUNT MODELS
// =============================================

model User {
  id              String    @id @default(cuid())
  discordId       String    @unique
  discordUsername  String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  linkedAccounts  LinkedAccount[]
  preferences     UserPreference?
  matchRecords    MatchRecord[]
  deliveryLogs    DeliveryLog[]

  @@index([discordId])
}

model LinkedAccount {
  id              String    @id @default(cuid())
  userId          String
  platform        Platform  // STEAM, RIOT, EPIC, FACEIT
  platformUserId  String    // Steam64 ID, PUUID, Epic ID
  platformUsername String?  // Display name on platform
  region          String?   // For Riot: NA1, EUW1, etc.
  accessToken     String?   // Encrypted OAuth token (if applicable)
  refreshToken    String?   // Encrypted refresh token (if applicable)
  tokenExpiresAt  DateTime? // Token expiry
  metadata        Json?     // Platform-specific extras (share codes, etc.)
  allstarUserId   String?   // Allstar's internal user ID for this account
  isActive        Boolean   @default(true)
  lastSyncedAt    DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  matchRecords    MatchRecord[]

  @@unique([platform, platformUserId])
  @@index([userId])
  @@index([platform, platformUserId])
}

enum Platform {
  STEAM
  RIOT
  EPIC
  FACEIT
}

// =============================================
// PREFERENCE MODEL
// =============================================

model UserPreference {
  id                    String   @id @default(cuid())
  userId                String   @unique
  dmEnabled             Boolean  @default(true)
  serverFeedOptIn       Boolean  @default(false)
  enabledGames          Json     @default("[\"CS2\",\"LOL\",\"DOTA2\",\"FORTNITE\"]")
  clipTypes             Json     @default("[\"HIGHLIGHT\",\"POTG\",\"MOMENT\"]")
  minClipRating         Int      @default(0)  // 0 = all clips, higher = only top clips
  deliveryFormat        DeliveryFormat @default(AUTO) // AUTO, LINK_ONLY, FILE_ONLY
  quietHoursStart       String?  // "23:00" (HH:MM UTC)
  quietHoursEnd         String?  // "07:00" (HH:MM UTC)
  timezone              String   @default("UTC")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum DeliveryFormat {
  AUTO      // File if <25MB, link otherwise
  LINK_ONLY // Always send links
  FILE_ONLY // Always attempt file (skip if too large)
}

// =============================================
// MATCH & CLIP MODELS
// =============================================

model MatchRecord {
  id                String       @id @default(cuid())
  userId            String
  linkedAccountId   String
  game              Game
  matchExternalId   String       // Platform-specific match ID
  matchData         Json?        // Full match stats (KDA, map, score, duration)
  status            MatchStatus  @default(DETECTED)
  allstarRequestId  String?      // Allstar's clip request ID
  detectedAt        DateTime     @default(now())
  clipsRequestedAt  DateTime?
  clipsReadyAt      DateTime?
  deliveredAt       DateTime?
  failureReason     String?
  retryCount        Int          @default(0)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  user              User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  linkedAccount     LinkedAccount @relation(fields: [linkedAccountId], references: [id])
  clips             Clip[]
  deliveryLogs      DeliveryLog[]

  @@unique([game, matchExternalId, linkedAccountId])
  @@index([userId, status])
  @@index([status, updatedAt])
  @@index([linkedAccountId, game])
}

enum Game {
  CS2
  LOL
  DOTA2
  FORTNITE
}

enum MatchStatus {
  DETECTED          // Match found by poller
  CLIPS_REQUESTED   // Clip request sent to Allstar
  CLIPS_PROCESSING  // Allstar is processing
  CLIPS_READY       // All clips available
  DELIVERING        // Currently sending to user
  DELIVERED         // Successfully delivered
  FAILED            // Failed after max retries
  SKIPPED           // User preference excluded this match
}

model Clip {
  id              String    @id @default(cuid())
  matchRecordId   String
  allstarClipId   String    @unique
  clipType        ClipType
  clipUrl         String    // allstar.gg/clip?clip={id}
  videoUrl        String?   // Direct MP4 URL (if available from API)
  iframeUrl       String?   // allstar.gg/iframe?clip={id}
  thumbnailUrl    String?
  title           String?   // "4K with AK-47" or "Pentakill"
  description     String?
  durationSeconds Int?
  fileSizeBytes   BigInt?
  gameRound       Int?      // Which round this clip is from
  metadata        Json?     // Game-specific clip metadata
  createdAt       DateTime  @default(now())

  matchRecord     MatchRecord @relation(fields: [matchRecordId], references: [id], onDelete: Cascade)

  @@index([matchRecordId])
}

enum ClipType {
  HIGHLIGHT   // Notable play (multi-kill, clutch, etc.)
  POTG        // Play of the Game
  MOMENT      // Specific selected moment
  CUSTOM      // Custom/partner-defined clip type
}

// =============================================
// DELIVERY TRACKING
// =============================================

model DeliveryLog {
  id              String         @id @default(cuid())
  userId          String
  matchRecordId   String
  deliveryType    DeliveryType
  channelType     ChannelType    // DM or SERVER_CHANNEL
  channelId       String?        // Discord channel ID if server channel
  messageId       String?        // Discord message ID
  clipCount       Int
  success         Boolean
  errorMessage    String?
  deliveredAt     DateTime       @default(now())

  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  matchRecord     MatchRecord    @relation(fields: [matchRecordId], references: [id], onDelete: Cascade)

  @@index([userId, deliveredAt])
}

enum DeliveryType {
  CLIPS       // Clip delivery message
  SUMMARY     // Match summary only
  ERROR       // Error notification to user
}

enum ChannelType {
  DM
  SERVER_CHANNEL
}

// =============================================
// GUILD CONFIGURATION
// =============================================

model GuildConfig {
  id                String   @id @default(cuid())
  guildId           String   @unique
  feedChannelId     String?  // Channel for community highlight feed
  adminRoleId       String?  // Role that can manage bot settings
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([guildId])
}

// =============================================
// POLLING STATE (prevents duplicate detection)
// =============================================

model PollState {
  id                  String   @id @default(cuid())
  linkedAccountId     String
  game                Game
  lastKnownMatchId    String?  // Last processed match ID
  lastPollAt          DateTime?
  lastMatchDetectedAt DateTime?
  consecutiveErrors   Int      @default(0)
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([linkedAccountId, game])
  @@index([isActive, game])
}
```

### 8.2 Key Design Decisions

**Why PostgreSQL over MongoDB**: Relational integrity matters here. User → LinkedAccount → MatchRecord → Clip is a clear hierarchy. We need transactional guarantees when updating match status. Prisma's type safety with PostgreSQL is excellent for TypeScript.

**Why encrypted tokens**: LinkedAccount stores OAuth tokens for Riot and Epic. These must be encrypted at rest using AES-256-GCM. The encryption key is loaded from environment, never stored in code or DB.

**Why PollState is separate**: Polling state changes very frequently (every 60-90 seconds per active user-game pair). Keeping it in its own table avoids lock contention on the LinkedAccount table and allows efficient batch queries.

**Why BigInt for fileSizeBytes**: Video files can exceed 2GB; JavaScript's Number type loses precision above ~9 petabytes with BigInt, but standard Int would cap at 2.1GB which is too close for comfort.

---

## 9. ALLSTAR PARTNER API INTEGRATION LAYER

### 9.1 API Client Design — src/integrations/allstar/AllstarClient.ts

**Architecture**: A typed HTTP client wrapping the Allstar Partner API. Uses `undici` (built into Node.js 18+) or `axios` for HTTP requests.

**Authentication**: Every request includes the API key in the header:
```
Authorization: Bearer {ALLSTAR_API_KEY}
```
OR (depending on Allstar's spec, which may use a custom header):
```
X-API-Key: {ALLSTAR_API_KEY}
```
The exact header name will be confirmed during partner onboarding.

**Core Methods** (based on reverse-engineering the partner API from Leetify's integration pattern and the API overview at partners.allstar.gg):

```
AllstarClient
├── registerUser(platformId, platform, options?)
│   → Creates/registers a user on Allstar under our partner account
│   → Returns: { allstarUserId, status }
│
├── requestClips(params: ClipRequestParams)
│   → Submits a clip generation request for a specific match
│   → Params: { game, platformUserId, matchId, clipTypes?, rounds? }
│   → Returns: { requestId, estimatedTime, status }
│
├── getClipStatus(requestId)
│   → Checks the processing status of a clip request
│   → Returns: { status: 'processing' | 'completed' | 'failed', clips?: ClipData[] }
│
├── getUserClips(allstarUserId, params?)
│   → Fetches all clips for a user, with optional filters
│   → Params: { game?, since?, limit?, offset? }
│   → Returns: { clips: ClipData[], total, hasMore }
│
├── getClipDetails(clipId)
│   → Fetches detailed metadata for a specific clip
│   → Returns: ClipData with full metadata including video URLs
│
├── getClipVideoUrl(clipId)
│   → Resolves the direct MP4 download URL for a clip
│   → Returns: { url, expiresAt, sizeBytes }
│
├── getMatchClips(game, matchId, platformUserId)
│   → Fetches all clips from a specific match for a specific user
│   → This is the KEY method for our pipeline
│   → Returns: { clips: ClipData[], matchInfo? }
│
├── configureWebhook(endpoint, secret, events)
│   → Registers our webhook endpoint with Allstar
│   → Events: ['clip.completed', 'clip.failed', 'user.updated']
│
└── healthCheck()
    → Verifies API connectivity and auth validity
    → Returns: { healthy: boolean, latencyMs: number }
```

**IMPORTANT NOTE ON API SPECIFICS**: The exact endpoints, request/response shapes, and available methods will only be fully known after completing partner onboarding at developer.allstar.gg. The above is architected based on:
1. The API overview at partners.allstar.gg (confirmed: REST, JSON, API key auth, rate limits)
2. How Leetify integrates (send highlight requests, receive clip data)
3. Common patterns in similar video processing APIs
4. The partner portal iFrame viewer (confirms clip IDs and embed URLs)

**During onboarding, the AI agent implementing this must**:
1. Read the full API documentation provided by Allstar
2. Update `docs/api/allstar-partner-api.md` with exact endpoints
3. Update `src/integrations/allstar/AllstarTypes.ts` with exact types
4. Adjust AllstarClient methods to match actual API
5. Update this BLUEPRINT with any architectural changes needed

### 9.2 Allstar Webhook Handler — src/integrations/allstar/AllstarWebhookHandler.ts

If webhooks are granted (they're for "selected partners"), this handler:

1. Receives POST requests at `/webhooks/allstar`
2. Validates the webhook signature using the shared secret (HMAC-SHA256)
3. Parses the event type and payload
4. For `clip.completed` events: Updates MatchRecord status and enqueues delivery job
5. For `clip.failed` events: Marks MatchRecord as failed, notifies user if needed
6. Returns 200 immediately (processing is async)

**Fallback**: If webhooks are not available, the ClipMonitorService handles polling instead. The system is designed to work with EITHER webhooks OR polling, seamlessly.

### 9.3 Rate Limit Handling

Allstar's API returns 429 with rate limit information. The client must:
1. Read `Retry-After` header (or equivalent)
2. Back off for the specified duration
3. Use a token bucket algorithm for proactive rate limiting
4. Track rate limit state in Redis for cross-request awareness

---

## 10. GAME PLATFORM ACCOUNT LINKING SYSTEM

### 10.1 Steam Account Linking

**Flow**:
1. User runs `/link steam`
2. Bot responds with ephemeral message containing a unique, time-limited URL to our web portal:
   `https://clipvault.example.com/auth/steam?state={encrypted_state}`
   where `state` contains: `{ discordUserId, timestamp, nonce }`
3. User clicks URL → redirected to Steam OpenID login
4. Steam authenticates user → redirects back to our callback
5. Callback extracts Steam64 ID from OpenID claimed_id
6. Server decrypts state, validates timestamp (max 10 min old)
7. Creates/updates LinkedAccount with Steam64 ID
8. Registers user with Allstar Partner API
9. Fetches Steam profile info (avatar, display name) via Steam Web API
10. Redirects user to success page: "Account linked! You can close this tab."
11. Bot sends DM confirmation: "✅ Steam account **{username}** linked! Tracking CS2 and Dota 2."

**CS2 Share Codes**: For CS2 specifically, Allstar needs match share codes to access match data from Valve. The user needs to provide these once:
1. After Steam link, bot sends follow-up message explaining share codes
2. Provides link to Steam share code page
3. User provides share code and auth code via a modal or follow-up command
4. Stored in LinkedAccount.metadata as encrypted JSON

**Why Steam OpenID**: Steam does not offer standard OAuth2. They use OpenID 2.0. This is well-documented and there are Node.js libraries for it (e.g., `passport-steam`, `openid`). Steam OpenID returns the Steam64 ID directly in the authentication response — no additional API call needed.

### 10.2 Riot Account Linking

**Flow**:
1. User runs `/link riot`
2. Bot responds with ephemeral message containing Riot OAuth2 URL (RSO — Riot Sign On)
3. User authenticates with Riot → redirected to our callback with auth code
4. Server exchanges auth code for access token + refresh token
5. Server calls Riot Account-V1 API to get PUUID and Riot ID (gameName#tagLine)
6. Creates LinkedAccount with PUUID and region
7. Registers with Allstar Partner API
8. Bot confirms: "✅ Riot account **{gameName}#{tagLine}** linked! Tracking League of Legends."

**Region Selection**: After linking, the bot must ask the user which region they play on. This is critical for Riot API routing. Options: NA1, EUW1, EUN1, KR, JP1, BR1, LA1, LA2, OC1, TR1, RU, PH2, SG2, TH2, TW2, VN2.

The region is stored in LinkedAccount.region and used for all subsequent Riot API calls.

**Token Refresh**: Riot OAuth tokens expire. The AccountSyncService refreshes tokens before expiry:
1. Check token expiry daily
2. If within 24 hours of expiry: refresh
3. If refresh fails: Mark account as requiring re-auth, notify user

### 10.3 Epic Games Account Linking

**Flow**: Similar to Riot — standard OAuth2 flow via Epic's auth system.

**Challenge**: Epic Games does not provide a public match history API for Fortnite. Options:
1. Use unofficial APIs (FortniteTracker, Fortnite-API.com) — risk of breaking
2. Use Epic's official stats API which provides cumulative stats — detect stat changes
3. Rely on Allstar to handle match detection for Fortnite (if their API supports it)

**Decision**: Mark Fortnite integration as "Beta" in MVP. Use option 2 (stat change detection) as primary, with option 1 as fallback. Document limitations clearly.

### 10.4 FACEIT Account Linking

**Flow**: FACEIT has standard OAuth2.
1. User runs `/link faceit`
2. OAuth2 flow to FACEIT
3. Get FACEIT player ID and nickname
4. Store as additional LinkedAccount linked to same User
5. FACEIT matches for CS2 can be detected via FACEIT API

**Why separate from Steam**: A user might play CS2 on both Valve matchmaking (Steam) and FACEIT. These are different match sources. The Match Detection Engine must check both for the same game.

### 10.5 Account Linking Architecture

**AccountLinkService** orchestrates:
```
linkAccount(discordUserId, platform, authData)
  1. Validate authData (platform-specific)
  2. Check if account already linked to ANOTHER Discord user → error
  3. Check if user already has this platform linked → update instead of create
  4. Create LinkedAccount record
  5. Register with Allstar Partner API
  6. Create PollState entries for applicable games
  7. Return success with platform display info

unlinkAccount(discordUserId, platform, platformUserId)
  1. Find LinkedAccount
  2. Deactivate PollState entries
  3. Mark LinkedAccount as inactive (soft delete)
  4. Optionally notify Allstar to stop tracking
  5. Confirm to user
```

---

## 11. MATCH DETECTION & POLLING ENGINE

### 11.1 Architecture

The Match Detection Engine is the HEARTBEAT of ClipVault. It continuously monitors for new match completions across all linked accounts and all supported games.

**Design**:
- A BullMQ repeatable job (`match-detection-scheduler`) fires every 30 seconds
- Each firing, it loads a batch of active PollState records
- For each PollState, it dispatches to the game-specific poller
- Pollers are STATELESS — they read lastKnownMatchId from PollState, query the external API, and return any new matches
- New matches are written to MatchRecord and enqueued for clip generation

### 11.2 Polling Strategy

**Batch Processing**: Don't poll all users every 30 seconds. Instead:
1. Partition users into time-slots: `userSlot = hash(userId) % NUM_SLOTS`
2. Each scheduler tick processes one slot
3. With 60 slots and 30-second ticks, each user is polled every ~30 minutes
4. For active users (recently played), increase poll frequency to every 2-5 minutes
5. Active detection: If a user was in-game recently (from previous poll), poll more aggressively

**Adaptive Polling**:
```
if (user.lastMatchDetectedAt > 30 minutes ago) → poll every 2 minutes (just finished?)
else if (user.lastMatchDetectedAt > 24 hours ago) → poll every 5 minutes
else if (user.lastMatchDetectedAt > 7 days ago) → poll every 15 minutes
else → poll every 30 minutes (inactive user)
```

This is managed by the `matchPollScheduler.ts` which adjusts BullMQ job delays dynamically.

### 11.3 CS2 Poller — src/services/match/pollers/CS2Poller.ts

**Data Source**: Steam Web API + Valve GCPD endpoints

**Method**:
1. Call Steam Match History API with the user's Steam64 ID and share codes
2. Get list of recent match IDs
3. Compare against `PollState.lastKnownMatchId`
4. For each new match:
   - Fetch basic match data (map, score, mode, duration)
   - Verify it's a supported mode (Competitive or Wingman)
   - Check match timestamp (ignore matches older than 24 hours to avoid backfill flood)
   - Create MatchRecord with status DETECTED
5. Update PollState with latest match ID and timestamp

**CS2-Specific Concerns**:
- Match share codes may expire or become invalid — handle gracefully
- Valve API may have delays (matches appear 5-15 min after completion)
- Wingman (2v2) and Competitive (5v5) both supported
- Casual, Deathmatch, Arms Race, etc. are NOT supported by Allstar

### 11.4 League of Legends Poller — src/services/match/pollers/LoLPoller.ts

**Data Source**: Riot Match-V5 API

**Method**:
1. Call `/lol/match/v5/matches/by-puuid/{puuid}/ids` with `startTime` set to last poll timestamp
2. For each new match ID:
   - Fetch match details: `/lol/match/v5/matches/{matchId}`
   - Extract: game mode, champion, K/D/A, win/loss, duration, lane
   - Verify mode is supported (Ranked Solo, Ranked Flex, Normal Draft — confirm with Allstar)
   - Create MatchRecord
3. Update PollState

**LoL-Specific Concerns**:
- Regional routing: Match IDs use regional routes (americas, europe, asia, sea)
- Rate limits are strict: 20 req/sec, 100 req/2min for personal keys
- Need production key for scale
- ARAM/URF/special modes — check if Allstar supports clips for these

### 11.5 Dota 2 Poller — src/services/match/pollers/Dota2Poller.ts

**Data Source**: Steam Web API (`GetMatchHistory`) + OpenDota API (fallback/enrichment)

**Method**:
1. Call Steam Dota 2 API: `/IDOTA2Match_570/GetMatchHistory/v1/?account_id={steam32}&matches_requested=5`
2. Compare match IDs against PollState
3. For new matches, fetch details via `/IDOTA2Match_570/GetMatchDetails/v1/?match_id={id}`
4. Alternative: OpenDota API `https://api.opendota.com/api/players/{steam32}/recentMatches`
5. Create MatchRecord with hero, K/D/A, game mode, duration

**Dota 2-Specific Concerns**:
- Steam32 ID needed (derived from Steam64): `steam32 = steam64 - 76561197960265728`
- OpenDota has its own rate limits but no key required for basic endpoints
- Turbo mode may or may not be supported by Allstar

### 11.6 Fortnite Poller — src/services/match/pollers/FortnitePoller.ts

**Data Source**: Fortnite-API.com or FortniteTracker API

**Method** (stat-change detection):
1. Fetch current player stats (total kills, total wins, total matches)
2. Compare against last known stats stored in PollState.metadata
3. If total matches increased: A match was completed
4. Calculate delta to estimate K/D for the match (approximation)
5. Create MatchRecord (match ID will be synthetic: `fn_{timestamp}_{userId}`)
6. Update stored stats in PollState

**Fortnite-Specific Concerns**:
- No reliable match ID system from unofficial APIs
- Stat-change detection has inherent delays
- Allstar's Fortnite clip generation may use Epic's replay system
- Mark this integration as BETA prominently in user-facing messaging

### 11.7 Base Poller Contract — src/services/match/pollers/BasePoller.ts

Every poller implements:
```
abstract class BasePoller {
  abstract game: Game;

  abstract poll(linkedAccount: LinkedAccount, pollState: PollState): Promise<DetectedMatch[]>;

  // Common utilities
  protected shouldPoll(pollState: PollState): boolean;
  protected updatePollState(pollState: PollState, latestMatchId: string): Promise<void>;
  protected handlePollError(pollState: PollState, error: Error): Promise<void>;
}

interface DetectedMatch {
  externalMatchId: string;
  game: Game;
  matchData: {
    map?: string;
    mode?: string;
    result?: 'win' | 'loss' | 'draw';
    score?: string;
    kills?: number;
    deaths?: number;
    assists?: number;
    duration?: number;
    champion?: string;   // LoL
    hero?: string;       // Dota 2
    [key: string]: any;
  };
  timestamp: Date;
}
```

---

## 12. CLIP ORCHESTRATION PIPELINE

### 12.1 Pipeline Overview

The Clip Orchestrator manages the lifecycle of clip generation for a detected match. It coordinates between three sub-services:

```
ClipOrchestrator
├── ClipRequestService   → Sends requests TO Allstar
├── ClipMonitorService   → Tracks processing status
└── ClipFetchService     → Retrieves completed clip data
```

### 12.2 ClipRequestService

**When triggered**: MatchRecord status changes to DETECTED

**Logic**:
1. Load the MatchRecord and associated LinkedAccount
2. Validate the match is eligible (supported mode, not too old, not already requested)
3. Build Allstar API request with:
   - Game identifier
   - User's platform ID (Steam64, PUUID, etc.)
   - Match external ID
   - Requested clip types (from user preferences or "all")
4. Call `AllstarClient.requestClips()`
5. If successful:
   - Store Allstar request ID in MatchRecord
   - Update status to CLIPS_REQUESTED
   - Enqueue `clip-monitor` job with delay = game's expected processing time
6. If Allstar returns an error:
   - Log the error with full context
   - If retryable (429, 5xx): Enqueue retry with backoff
   - If permanent (400, 404): Mark FAILED with reason
   - Max 3 retries for the request phase

### 12.3 ClipMonitorService

**Two modes** — the service seamlessly handles both:

**Mode A: Webhook-Driven** (if Allstar grants webhook access)
1. Allstar webhook fires with `clip.completed` event
2. AllstarWebhookHandler processes event
3. Calls `ClipMonitorService.handleClipCompleted(requestId, clipData)`
4. Fetches full clip details for each clip
5. Creates Clip records in DB
6. Updates MatchRecord to CLIPS_READY
7. Enqueues `clip-deliver` job

**Mode B: Polling-Driven** (default/fallback)
1. `clip-monitor` worker fires after delay
2. Calls `AllstarClient.getClipStatus(requestId)` or `AllstarClient.getMatchClips()`
3. If status is `processing`: Re-enqueue with increasing delay
   - Delays: 15min → 20min → 30min → 45min → 60min → 60min (max 6 attempts)
4. If status is `completed`: Fetch all clip data, create Clip records
5. If status is `failed`: Mark MatchRecord as FAILED
6. After 6 hours with no completion: Mark as FAILED with timeout reason

### 12.4 ClipFetchService

**Responsibility**: Resolve clip metadata into deliverable assets.

1. For each Clip record:
   - Fetch full details from Allstar (title, description, duration, thumbnail)
   - Resolve direct video URL (if partner API provides signed download URLs)
   - Check video file size:
     - If < 25MB: Mark for file attachment delivery
     - If ≥ 25MB: Mark for link delivery
   - Store all resolved data in Clip record

2. If direct MP4 download URL is available from partner API:
   - Pre-download the video to a temp directory
   - Verify file integrity (check size matches expected)
   - Keep in temp for delivery (cleaned up after delivery completes)

3. If only web URLs are available:
   - Use clip URL (`allstar.gg/clip?clip={id}`) for link delivery
   - Use iFrame URL for embeds where supported
   - Fetch thumbnail URL for rich embeds

### 12.5 ClipFilterService

Before delivery, filter clips based on user preferences:

1. Load user's `UserPreference`
2. Filter by `clipTypes` — user may only want POTG and HIGHLIGHT, not every MOMENT
3. Filter by `minClipRating` — if Allstar provides a quality/significance score
4. Sort clips by significance (POTG first, then HIGHLIGHT, then MOMENT)
5. If no clips pass filters: Send a minimal "match completed" notification instead of clips

---

## 13. DISCORD DELIVERY SYSTEM

### 13.1 DeliveryEngine

**Input**: A fully-resolved MatchRecord with CLIPS_READY status and populated Clip records.

**Logic**:
1. Load User preferences
2. Check if DM is enabled
3. Check quiet hours (don't send between quietHoursStart and quietHoursEnd)
   - If in quiet hours: Re-enqueue with delay until quiet hours end
4. Run clips through ClipFilterService
5. Build delivery messages using MessageFormatter
6. Send via DMDispatcher
7. If server feed opted in: Also send to ChannelPoster
8. Log delivery in DeliveryLog
9. Update MatchRecord to DELIVERED

### 13.2 MessageFormatter — src/services/delivery/MessageFormatter.ts

**Match Summary Embed**: (sent first)
```
┌────────────────────────────────────────────┐
│ 🎮 CS2 Match Complete                      │
│                                            │
│ Map: Dust II                               │
│ Result: ✅ WIN (16-12)                     │
│ K/D/A: 24/15/6                             │
│ Duration: 42 minutes                       │
│                                            │
│ 📹 4 clips generated                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
│ ClipVault • Feb 25, 2025                   │
└────────────────────────────────────────────┘
```

**Clip Message**: (one per clip, or batched)
```
┌────────────────────────────────────────────┐
│ 🏆 Play of the Game — 4K with AK-47       │
│                                            │
│ Round 18 • Duration: 12s                   │
│                                            │
│ [📎 clip attached as video file]           │
│ or                                         │
│ [🔗 Watch on Allstar](https://allstar...)  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
└────────────────────────────────────────────┘
```

**Batching Strategy**:
- Discord allows 10 embeds per message
- If ≤ 3 clips with file attachments: Send all in one message
- If > 3 clips: Send summary embed first, then clips in batches of 3
- If > 10 clips total: Send summary + top 10 clips + "View all on Allstar" link
- Always include the match summary embed in the first message

### 13.3 DMDispatcher — src/services/delivery/DMDispatcher.ts

**Handles**:
1. Opening DM channel with user
2. Sending messages with proper rate limit awareness
3. Handling "Cannot send messages to this user" (DMs disabled):
   - Mark user preference as `dmEnabled: false`
   - Log the failure
   - Try again on next match (user may have re-enabled DMs)
4. Handling large file attachment uploads (respecting Discord rate limits)
5. Retry logic: 3 attempts with 5-second backoff
6. Between messages: 1-second delay to avoid rate limiting

### 13.4 ChannelPoster — src/services/delivery/ChannelPoster.ts

For servers with a configured feed channel:
1. Check if user has opted into server feed
2. Build a community-facing embed (less detailed than DM)
3. Post to the configured channel
4. Include user mention and a "nice play!" reaction button

---

## 14. DISCORD SLASH COMMAND INTERFACE

### 14.1 Command Definitions

**`/link`** — Link a gaming platform account
```
/link
  └── platform (required, string choice)
      ├── steam   — "Link your Steam account (CS2, Dota 2)"
      ├── riot    — "Link your Riot account (League of Legends)"
      ├── epic    — "Link your Epic Games account (Fortnite)"
      └── faceit  — "Link your FACEIT account (CS2 third-party)"
```
Response: Ephemeral message with OAuth link button

**`/unlink`** — Unlink a platform account
```
/unlink
  └── platform (required, string choice) — same options as /link
```
Response: Confirmation with "Are you sure?" button

**`/settings`** — Manage notification preferences
```
/settings
```
Response: Ephemeral message with settings panel:
- Toggle DM notifications (button)
- Select enabled games (multi-select menu)
- Select clip types (multi-select menu)
- Set delivery format (select menu: Auto / Links Only / Files Only)
- Set quiet hours (button → modal with time inputs)
- Toggle server feed opt-in (button)

**`/status`** — View current account status
```
/status
```
Response: Ephemeral embed showing:
- Linked accounts (platform, username, last sync)
- Active games being tracked
- Pending clips being processed
- Recent delivery stats

**`/history`** — View recent clip deliveries
```
/history
  └── count (optional, integer, default: 5, max: 20)
```
Response: List of recent deliveries with match info and clip links

**`/setup`** — Server admin configuration
```
/setup
  └── subcommand
      ├── feed-channel
      │   └── channel (required, channel mention)
      ├── admin-role
      │   └── role (required, role mention)
      └── disable — Disable ClipVault for this server
```
Response: Confirmation of setting change

**`/help`** — Show help information
```
/help
  └── topic (optional, string choice)
      ├── link     — How to link accounts
      ├── settings — How to configure preferences
      ├── games    — Supported games info
      └── (none)   — General overview
```

### 14.2 Interaction Flow Patterns

**Ephemeral Messages**: All command responses are ephemeral (only visible to the user) by default. This prevents cluttering server channels and protects user privacy.

**Button Interactions**: Settings use buttons for toggle operations. Each button has a custom_id that encodes the action and relevant parameters:
```
customId format: "cv:{action}:{param1}:{param2}"
Examples:
  "cv:toggle-dm:enable"
  "cv:toggle-game:CS2:enable"
  "cv:confirm-unlink:steam:acc123"
```

**Select Menu Interactions**: Used for multi-choice settings (games, clip types). The handler reads selected values and updates preferences atomically.

**Modals**: Used for quiet hours input (two text fields: start time and end time in HH:MM format).

---

## 15. OAUTH2 & AUTHENTICATION ARCHITECTURE

### 15.1 Web Portal — Minimal Auth Server

The Fastify web server exists solely for OAuth2 callback handling. It is NOT a full web application. It serves:

1. OAuth2 callback routes (Steam, Riot, Epic, FACEIT)
2. Allstar webhook receiver
3. Health check endpoint
4. A minimal success/error HTML page for post-auth redirect

### 15.2 State Parameter Security

Every OAuth2 flow uses a `state` parameter that is:
1. A JSON payload: `{ discordUserId, platform, nonce, timestamp }`
2. Encrypted with AES-256-GCM using the config.encryption.key
3. Base64url encoded for URL safety
4. Validated on callback:
   - Decrypt and parse
   - Verify timestamp < 10 minutes old
   - Verify nonce hasn't been used before (stored in Redis with 15-min TTL)
   - Extract discordUserId for account linking

### 15.3 Token Storage Security

All OAuth tokens (Riot, Epic, FACEIT) stored in the database are encrypted:
1. Encrypted with AES-256-GCM before storage
2. Encryption key loaded from environment variable
3. Decrypted only when needed for API calls
4. Token refresh handled by AccountSyncService
5. If decryption fails (key rotation): Mark account as requiring re-auth

### 15.4 Steam OpenID (Not OAuth2)

Steam uses OpenID 2.0, which is different from OAuth2:
1. No tokens are issued — authentication only
2. We redirect to `https://steamcommunity.com/openid/login`
3. Steam redirects back with `openid.claimed_id` containing the Steam64 ID
4. We validate the OpenID response signature with Steam's server
5. No token storage needed — we just store the Steam64 ID
6. Use `passport-steam` or `node-openid` library

---

## 16. WEB DASHBOARD (ACCOUNT LINKING PORTAL)

### 16.1 Scope for MVP

The web dashboard is MINIMAL in MVP. It exists only for:
1. OAuth callback handling (required by Steam, Riot, Epic, FACEIT)
2. A "success" page shown after linking
3. A "error" page shown if linking fails
4. Health check

### 16.2 Pages

**GET /auth/steam** — Initiates Steam OpenID flow
**GET /auth/steam/callback** — Handles Steam OpenID response
**GET /auth/riot** — Initiates Riot OAuth2 flow
**GET /auth/riot/callback** — Handles Riot OAuth2 callback
**GET /auth/epic** — Initiates Epic OAuth2 flow
**GET /auth/epic/callback** — Handles Epic OAuth2 callback
**GET /auth/faceit** — Initiates FACEIT OAuth2 flow
**GET /auth/faceit/callback** — Handles FACEIT OAuth2 callback
**GET /success** — Static success page
**GET /error** — Static error page with message
**POST /webhooks/allstar** — Allstar webhook receiver
**GET /health** — Returns `{ status: "ok", uptime, version }`

### 16.3 Future Dashboard (Post-MVP)

A full web dashboard would add:
- Account management UI (view/manage linked accounts)
- Clip gallery (view all your clips in a web UI)
- Detailed match history
- Preference management
- Premium features management

This is OUT OF SCOPE for MVP but the architecture supports it.

---

## 17. RATE LIMITING & QUEUE MANAGEMENT

### 17.1 External API Rate Limits

| API | Rate Limit | Strategy |
|-----|-----------|----------|
| Allstar Partner | Per-key, specific limits from onboarding | Token bucket in Redis, respect 429 + Retry-After |
| Riot Games | 20/1s, 100/2min (personal) | Sliding window in Redis, batch queries, stagger |
| Steam Web API | 100,000/day | Simple counter in Redis, spread requests |
| OpenDota | 60/min (free tier) | Token bucket, cache responses |
| Discord API | 50 req/sec global, various per-route | discord.js handles this internally, but we add delays between DMs |
| Fortnite API | Varies by provider | Conservative polling, cache |

### 17.2 BullMQ Queue Configuration

**Queues**:
```
match-detection    — Repeatable job, 30-second interval
clip-request       — Standard queue, max concurrency 10
clip-monitor       — Delayed queue, max concurrency 5
clip-deliver       — Standard queue, max concurrency 5
account-sync       — Repeatable job, 1-hour interval
```

**Retry Configuration**:
```
clip-request:  3 retries, exponential backoff (30s, 2min, 10min)
clip-monitor:  6 retries, custom delays (15min, 20min, 30min, 45min, 60min, 60min)
clip-deliver:  3 retries, exponential backoff (5s, 30s, 2min)
account-sync:  2 retries, fixed delay (5min)
```

**Dead Letter Queue**: Failed jobs (exhausted retries) are moved to a `failed-jobs` queue for manual inspection and alerting.

### 17.3 Internal Rate Limiting

**Discord DM Sending**:
- Max 5 DMs per second across all users
- Max 1 DM per second per user
- Implemented via BullMQ rate limiter on clip-deliver queue

**Allstar API Calls**:
- Rate limit middleware in AllstarClient
- Shared Redis counter tracks calls per time window
- Auto-throttle when approaching limit

---

## 18. ERROR HANDLING & RESILIENCE PATTERNS

### 18.1 Error Hierarchy

```
ClipVaultError (base)
├── ConfigurationError       — Missing/invalid config
├── AuthenticationError      — OAuth failures, invalid tokens
├── PlatformAPIError         — External API errors
│   ├── AllstarAPIError
│   ├── SteamAPIError
│   ├── RiotAPIError
│   └── EpicAPIError
├── MatchDetectionError      — Match polling failures
├── ClipProcessingError      — Clip generation/fetch failures
├── DeliveryError            — Discord DM/channel send failures
│   ├── DMBlockedError       — User has DMs disabled
│   └── RateLimitError       — Discord rate limited
├── DatabaseError            — Prisma/PostgreSQL errors
└── ValidationError          — Input validation failures
```

### 18.2 Resilience Patterns

**Circuit Breaker** (for external APIs):
- Track consecutive failures per API
- After 5 consecutive failures: Open circuit (stop calling API)
- After 60 seconds: Half-open (try one call)
- If succeeds: Close circuit (resume normal)
- If fails: Re-open circuit

**Graceful Degradation**:
- If Allstar is down: Queue clip requests, process when available
- If Riot API is down: Skip LoL polling, continue other games
- If Discord API is degraded: Queue deliveries, retry later
- If Redis is down: Fall back to in-memory queues (reduced durability)
- If PostgreSQL is down: Halt processing (critical dependency)

**Idempotency**:
- Match detection: Unique constraint on (game, matchExternalId, linkedAccountId) prevents duplicates
- Clip requests: Track allstarRequestId to prevent double-requesting
- Delivery: Track delivery log to prevent double-sending

### 18.3 User-Facing Error Communication

When errors affect a user, communicate clearly via DM:

```
⚠️ ClipVault Notice

We detected your CS2 match on Dust II but encountered an issue
generating clips. We'll automatically retry.

If this persists, try running /status to check your account.
```

Never expose technical details. Log technical details internally.

---

## 19. LOGGING, MONITORING & OBSERVABILITY

### 19.1 Structured Logging

**Library**: pino (fast structured JSON logging)

**Log Levels**:
- `fatal`: Process-ending errors
- `error`: Operation failures that need attention
- `warn`: Degraded behavior or recovered errors
- `info`: Normal operations (match detected, clip delivered, user linked)
- `debug`: Detailed operational data (API request/response, job processing)
- `trace`: Very verbose (individual polling cycles, cache hits)

**Standard Fields** (every log entry):
```json
{
  "level": "info",
  "time": "2025-02-25T10:30:00Z",
  "msg": "Clip delivered to user",
  "service": "DeliveryEngine",
  "userId": "cuid_xxx",
  "discordId": "123456789",
  "matchId": "cuid_yyy",
  "game": "CS2",
  "clipCount": 4,
  "deliveryMs": 2340,
  "traceId": "uuid-xxx"
}
```

### 19.2 Health Metrics

Expose via `/health` endpoint and log periodically:
- Active users (linked accounts count)
- Matches detected (last hour, last day)
- Clips requested / completed / failed (last hour)
- Deliveries sent / failed (last hour)
- Queue depths (per queue)
- External API health (last response time, error rate)
- Memory usage, event loop lag

### 19.3 Alerting (Post-MVP)

Set up alerts for:
- Delivery failure rate > 10%
- Allstar API errors > 5 consecutive
- Queue depth growing unbounded
- No matches detected for > 1 hour (for active users)
- Memory usage > 80% of limit

---

## 20. CONFIGURATION & ENVIRONMENT MANAGEMENT

### 20.1 Environment Variables

```env
# ============================================
# DISCORD
# ============================================
DISCORD_TOKEN=                  # Bot token from Discord Developer Portal
DISCORD_CLIENT_ID=              # Application ID
DISCORD_CLIENT_SECRET=          # OAuth2 client secret
DEPLOY_COMMANDS=false           # Set to 'true' to register slash commands on boot

# ============================================
# ALLSTAR PARTNER API
# ============================================
ALLSTAR_API_KEY=                # Partner API key from onboarding
ALLSTAR_BASE_URL=https://partners.allstar.gg/api/v1  # Base URL (adjust per docs)
ALLSTAR_WEBHOOK_SECRET=         # Shared secret for webhook verification

# ============================================
# STEAM
# ============================================
STEAM_API_KEY=                  # From steamcommunity.com/dev/apikey

# ============================================
# RIOT GAMES
# ============================================
RIOT_API_KEY=                   # From developer.riotgames.com
RIOT_CLIENT_ID=                 # RSO OAuth2 client ID
RIOT_CLIENT_SECRET=             # RSO OAuth2 client secret

# ============================================
# EPIC GAMES
# ============================================
EPIC_CLIENT_ID=                 # Epic OAuth2 client ID
EPIC_CLIENT_SECRET=             # Epic OAuth2 client secret

# ============================================
# FACEIT
# ============================================
FACEIT_CLIENT_ID=               # FACEIT OAuth2 client ID
FACEIT_CLIENT_SECRET=           # FACEIT OAuth2 client secret

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:pass@localhost:5432/clipvault

# ============================================
# REDIS
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# WEB SERVER
# ============================================
WEB_PORT=3000
WEB_BASE_URL=https://clipvault.example.com  # Public URL for OAuth callbacks

# ============================================
# SECURITY
# ============================================
ENCRYPTION_KEY=                 # 256-bit hex key for token encryption
SESSION_SECRET=                 # Random string for session signing

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_CS2=true
ENABLE_LOL=true
ENABLE_DOTA2=true
ENABLE_FORTNITE=false           # Beta — disabled by default
ENABLE_WEBHOOKS=false           # Enable if Allstar grants webhook access

# ============================================
# TUNING
# ============================================
POLL_INTERVAL_MS=30000          # Base poll scheduler interval
POLL_BATCH_SIZE=50              # Users per poll batch
MAX_CLIP_MONITOR_RETRIES=6     # Max times to check clip status
LOG_LEVEL=info                  # pino log level
NODE_ENV=production
```

---

## 21. DEPLOYMENT ARCHITECTURE

### 21.1 Docker Compose (Local Development)

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    env_file: .env
    depends_on:
      - postgres
      - redis
    volumes:
      - ./src:/app/src  # Hot reload

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: clipvault
      POSTGRES_USER: clipvault
      POSTGRES_PASSWORD: clipvault_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 21.2 Production Deployment

**Recommended**: Single VPS with Docker (Railway, Fly.io, or DigitalOcean App Platform)

**Minimum Requirements**:
- 2 vCPU, 2GB RAM (handles ~5,000 active users)
- PostgreSQL managed instance (Railway, Supabase, or Neon)
- Redis managed instance (Upstash or Railway)
- Persistent storage for temp video files (cleaned after delivery)

**Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 21.3 Domain & SSL

- Domain: e.g., `clipvault.gg` or `api.clipvault.gg`
- SSL: Handled by deployment platform (Railway/Fly auto-provision)
- Required for: OAuth2 callbacks, Allstar webhook receiver

---

## 22. TESTING STRATEGY

### 22.1 Unit Tests

**What to test**:
- All pure functions (formatters, validators, steam ID converters)
- Service logic with mocked dependencies
- Poller logic with mocked API responses
- Embed builders with snapshot testing

**Framework**: Vitest (fast, TypeScript-native, Jest-compatible)

### 22.2 Integration Tests

**What to test**:
- Full pipeline: match detected → clip requested → clip ready → delivered
- Account linking flow (mocked OAuth)
- Database operations (using test database)
- Queue processing (using test Redis)

### 22.3 E2E Tests

**What to test**:
- Bot responds to slash commands correctly
- OAuth callback processing works
- Webhook processing works
- Full delivery with mock Allstar responses

### 22.4 Manual Testing Checklist

Before any release:
- [ ] Link a Steam account and verify CS2 match detection
- [ ] Link a Riot account and verify LoL match detection
- [ ] Verify clips are delivered via DM with correct formatting
- [ ] Verify large clips get link delivery instead of file
- [ ] Verify /settings changes are respected
- [ ] Verify /unlink properly stops tracking
- [ ] Verify quiet hours are respected
- [ ] Verify error messages are user-friendly

---

## 23. AI AGENT WORKFLOW & DOCUMENTATION PROTOCOL

### 23.1 How AI Agents Should Work With This Repository

This project is designed to be built primarily by AI coding agents (Claude Code CLI, Codex CLI). The documentation structure is optimized for this:

1. **Before implementing any module**: Read BLUEPRINT.md section for that module, then read `docs/modules/{module}.md`
2. **While implementing**: Follow the types and interfaces defined in the docs
3. **After implementing**: Update `docs/modules/{module}.md` to reflect actual implementation
4. **If deviating from blueprint**: Document the reason in `docs/architecture/decisions.md`

### 23.2 Documentation Update Rules

These rules are ENFORCED in AGENTS.md and CLAUDE.md:

1. **Every PR/commit that changes src/ must also update docs/**
2. **Every new file in src/ must have a corresponding entry in docs/**
3. **Deleted files must have their docs entry marked as deprecated/removed**
4. **docs/ files must include working examples, not just descriptions**
5. **Type definitions in docs/ must match actual TypeScript types**

### 23.3 Agent Context Loading Strategy

When an agent needs to work on a specific feature:

**Narrow context** (changing one service):
1. Read `CLAUDE.md` (project-wide context)
2. Read `docs/modules/{relevant-module}.md`
3. Read the actual source files for that module
4. Make changes
5. Update docs

**Broad context** (cross-cutting change):
1. Read `CLAUDE.md`
2. Read `BLUEPRINT.md` section for the affected area
3. Read `docs/architecture/overview.md`
4. Read all affected `docs/modules/*.md` files
5. Plan the change across modules
6. Implement
7. Update all affected docs

---

## 24. AGENTS.MD SPECIFICATION

The AGENTS.md file should contain:

```
# AGENTS.md — AI Agent Instructions for ClipVault

## Project Overview
[Brief project description — 3 sentences max]

## Architecture
[Link to BLUEPRINT.md and docs/architecture/overview.md]

## Key Rules
1. ALWAYS read docs/modules/{module}.md before modifying src/{module}/
2. ALWAYS update docs/ after any code change
3. NEVER introduce new dependencies without documenting in docs/architecture/decisions.md
4. ALWAYS run type checking (npx tsc --noEmit) before committing
5. ALWAYS maintain error handling consistency (use ClipVaultError hierarchy)
6. NEVER store secrets in code — use environment variables
7. ALWAYS use structured logging (pino) — never console.log in production code
8. Follow existing code patterns — examine neighboring files before writing new ones

## Common Tasks
### Adding a new slash command
1. Create file in src/core/discord/commands/
2. Register in src/core/discord/commands/index.ts
3. Run scripts/deploy-commands.ts
4. Update docs/modules/discord-client.md

### Adding support for a new game
1. Read docs/guides/adding-a-game.md
2. Create poller in src/services/match/pollers/
3. Add game definition in src/config/games.ts
4. Update Prisma schema if needed
5. Update docs/

### Debugging a failed delivery
1. Check delivery logs: query DeliveryLog for the user
2. Check match record status: MatchRecord may be stuck
3. Check BullMQ dashboard for failed jobs
4. Check logs for the delivery traceId

## File Naming Conventions
- Services: PascalCase with Service suffix (AccountLinkService.ts)
- Types: PascalCase with Types suffix (AllstarTypes.ts)
- Workers: camelCase with .worker suffix (clipRequest.worker.ts)
- Docs: kebab-case (match-detection.md)
```

---

## 25. CLAUDE.MD SPECIFICATION

The CLAUDE.md file should contain project context optimized for Claude Code:

```
# CLAUDE.md — ClipVault Project Context for Claude Code

## What is this project?
ClipVault is a Discord bot that automatically delivers gaming highlight clips
to users via DM. It integrates with Allstar.gg's Partner API for clip generation
and monitors game platforms (Steam, Riot, Epic) for match completions.

## Tech Stack
- TypeScript + Node.js 20
- discord.js v14 (Discord bot framework)
- Fastify (web server for OAuth callbacks)
- PostgreSQL + Prisma ORM (database)
- Redis + BullMQ (job queues)
- pino (logging)
- Vitest (testing)

## Quick References
- Architecture: see BLUEPRINT.md
- API details: see API.md
- Module docs: see docs/modules/
- Agent rules: see AGENTS.md

## Environment Setup
1. cp .env.example .env
2. Fill in API keys
3. docker-compose up -d (postgres + redis)
4. npx prisma migrate dev
5. npm run dev

## Build & Run
- npm run dev — Development with hot reload
- npm run build — TypeScript compilation
- npm start — Production start
- npm test — Run tests

## Key Patterns
- All external API calls go through src/integrations/{platform}/
- All business logic goes through src/services/
- All Discord interaction handling goes through src/core/discord/
- All background jobs go through src/jobs/
- Never call external APIs directly from commands or events

## Important: Documentation Protocol
After ANY code change, update the corresponding docs/modules/ file.
This is critical for maintaining context across agent sessions.
```

---

## 26. API.MD SPECIFICATION

The API.md file should serve as a comprehensive reference for all external API integrations used by the project. It should contain:

1. **Allstar Partner API**: Every endpoint used, with exact request/response shapes, auth headers, rate limits, and error codes. This section will be INCOMPLETE until partner onboarding is complete — mark unknown fields with `[TBD: confirm during onboarding]`.

2. **Steam Web API**: Endpoints for user lookup, CS2 match history, Dota 2 match history. Include example requests and responses.

3. **Riot Games API**: Match-V5 endpoints, Account-V1, Spectator-V5. Include regional routing rules.

4. **Epic Games / Fortnite**: Available endpoints and limitations. Document the stat-change detection approach.

5. **Discord API**: Key endpoints used beyond what discord.js handles (e.g., webhook-related).

6. **OpenDota API**: Dota 2 match data endpoints as fallback.

Each section should include:
- Base URL
- Authentication method
- Rate limits
- Endpoint path
- HTTP method
- Request headers
- Request body (with types)
- Response body (with types)
- Error codes
- Example request/response
- Notes and gotchas

---

## 27. SECURITY CONSIDERATIONS

### 27.1 Data Protection

- **Stored tokens**: AES-256-GCM encrypted at rest
- **OAuth state parameters**: Encrypted and time-limited (10 min TTL)
- **API keys**: Never logged, never in code, environment variables only
- **User data**: Minimal collection — only what's needed for functionality
- **Steam IDs**: Publicly available data, but still treat as PII for our purposes

### 27.2 API Security

- **Allstar webhooks**: HMAC-SHA256 signature verification
- **OAuth callbacks**: State parameter validation prevents CSRF
- **Web endpoints**: Rate limited to prevent abuse
- **Discord bot**: No message content intent (not needed), minimal permissions

### 27.3 Discord Bot Permissions

Minimum required permissions:
- Send Messages (for DM delivery)
- Embed Links (for rich embeds)
- Attach Files (for clip video attachments)
- Use Slash Commands (for command interface)
- Read Message History (only in configured feed channels)

NOT required:
- Message Content Intent (we don't read message content)
- Administrator
- Manage Messages/Channels/Roles

### 27.4 Compliance Notes

- Respect Riot Games Developer Terms of Service (no exposing historic Riot IDs)
- Respect Steam Subscriber Agreement
- Respect Allstar Partner Agreement terms
- Respect Discord Terms of Service (no spam, no unsolicited DMs to non-users)
- GDPR considerations: Implement /delete-my-data command for data deletion requests

---

## 28. SCALABILITY ROADMAP

### 28.1 MVP Scale (Month 1-3)

- **Target**: 1,000 active users
- **Architecture**: Single process, single server
- **Database**: Shared PostgreSQL
- **Cost**: ~$20-40/month

### 28.2 Growth Scale (Month 3-6)

- **Target**: 10,000 active users
- **Changes**:
  - Separate worker processes from web/Discord process
  - Database connection pooling (PgBouncer)
  - Redis cluster for queue reliability
- **Cost**: ~$50-100/month

### 28.3 Production Scale (Month 6+)

- **Target**: 100,000+ active users
- **Changes**:
  - Multiple worker instances (horizontal scaling)
  - Read replicas for database
  - CDN for video file serving
  - Dedicated queue infrastructure
  - Consider: Partner with Allstar for dedicated higher rate limits
- **Cost**: ~$200-500/month

---

## 29. PHASE-BY-PHASE IMPLEMENTATION PLAN

### Phase 0: Foundation (Days 1-3)

**Goal**: Project scaffolding, tooling, configuration

**Tasks**:
1. Initialize TypeScript project with strict config
2. Set up ESLint + Prettier
3. Set up docker-compose with PostgreSQL + Redis
4. Implement src/config/ (config loader, constants, game definitions)
5. Implement src/utils/ (logger, errors, retry, steamId, crypto, validation)
6. Implement src/database/prisma.ts (Prisma client singleton)
7. Design and create Prisma schema (all models from §8)
8. Run initial migration
9. Set up Vitest
10. Create AGENTS.md, CLAUDE.md, initial API.md
11. Create all docs/modules/*.md files with blueprint-based content (pre-implementation)
12. Create .env.example

**Deliverables**: A buildable project with config, DB, and utilities. All docs scaffolded.

### Phase 1: Discord Core (Days 4-7)

**Goal**: Working Discord bot with slash commands (no backend logic yet)

**Tasks**:
1. Implement src/core/discord/client.ts (Discord.js client setup)
2. Implement all event handlers (ready, interactionCreate, guildCreate)
3. Implement command registry and deployment script
4. Implement all slash commands (link, unlink, settings, status, history, setup, help)
5. Implement all embeds (match summary, clip card, account info, onboarding)
6. Implement button and select menu handlers for /settings
7. Test: Bot connects, responds to all commands with placeholder responses
8. Update docs/modules/discord-client.md

**Deliverables**: A fully interactive Discord bot. Commands work but return mock data.

### Phase 2: Account Linking (Days 8-14)

**Goal**: Users can link Steam, Riot, Epic, FACEIT accounts

**Tasks**:
1. Apply for Allstar Partner API access at developer.allstar.gg (START THIS EARLY — may take days)
2. Implement src/core/web/server.ts (Fastify setup)
3. Implement all OAuth callback routes (Steam, Riot, Epic, FACEIT)
4. Implement AccountLinkService, AccountValidationService
5. Implement src/integrations/steam/SteamAuth.ts
6. Implement src/integrations/riot/RiotAuth.ts
7. Implement src/integrations/epic/EpicAuth.ts (if Epic access available)
8. Implement crypto utilities for token encryption
9. Wire /link command to OAuth flow
10. Wire /unlink command to unlinking logic
11. Test: Full link/unlink flow for each platform
12. Update docs/modules/account-service.md, web-server.md, steam-integration.md, riot-integration.md

**Deliverables**: Users can link all supported platform accounts.

### Phase 3: Allstar Integration (Days 15-21)

**Goal**: Can request and receive clips from Allstar Partner API

**Tasks**:
1. Read and document Allstar Partner API (from onboarding documentation)
2. Update API.md with exact Allstar endpoints
3. Implement src/integrations/allstar/AllstarClient.ts
4. Implement AllstarTypes.ts with exact API types
5. Implement AllstarWebhookHandler.ts (if webhooks granted)
6. Implement AllstarErrors.ts
7. Test: Can register a user, request clips, receive clip data
8. Update docs/modules/allstar-integration.md

**Deliverables**: Working Allstar API integration. Can programmatically request and fetch clips.

### Phase 4: Match Detection (Days 22-28)

**Goal**: Automatic match detection for all supported games

**Tasks**:
1. Implement BullMQ queue definitions (src/jobs/queue.ts)
2. Implement matchPollScheduler.ts
3. Implement matchDetection.worker.ts
4. Implement BasePoller abstract class
5. Implement CS2Poller (Steam Web API integration)
6. Implement LoLPoller (Riot Match-V5 integration)
7. Implement Dota2Poller (Steam/OpenDota integration)
8. Implement FortnitePoller (stat-change detection)
9. Implement MatchDetectionService and MatchRecordService
10. Test: Play a game, verify match is detected and MatchRecord created
11. Update docs/modules/match-detection.md, job-system.md

**Deliverables**: System automatically detects matches for linked accounts.

### Phase 5: Clip Pipeline (Days 29-35)

**Goal**: Full clip orchestration from detection to delivery

**Tasks**:
1. Implement ClipOrchestrator
2. Implement ClipRequestService (sends requests to Allstar)
3. Implement ClipMonitorService (polls/receives clip status)
4. Implement ClipFetchService (resolves clip assets)
5. Implement ClipFilterService (applies user preferences)
6. Implement clipRequest.worker.ts, clipMonitor.worker.ts
7. Test: Detected match → clip requested → clip monitored → clips available
8. Update docs/modules/clip-orchestration.md

**Deliverables**: Complete clip generation pipeline working.

### Phase 6: Delivery (Days 36-42)

**Goal**: Clips delivered to users via Discord DM

**Tasks**:
1. Implement DeliveryEngine
2. Implement MessageFormatter (match summary + clip embeds)
3. Implement DMDispatcher (DM sending with retry)
4. Implement ChannelPoster (server feed posting)
5. Implement clipDeliver.worker.ts
6. Implement delivery logging
7. Test: Full end-to-end — play game → receive clips in DM
8. Update docs/modules/delivery-engine.md

**Deliverables**: Full pipeline working end-to-end.

### Phase 7: Preferences & Polish (Days 43-49)

**Goal**: User preferences respected, error handling complete

**Tasks**:
1. Implement PreferenceService with full CRUD
2. Wire /settings command to PreferenceService
3. Implement quiet hours logic in DeliveryEngine
4. Implement clip type filtering
5. Implement delivery format options
6. Implement /status with real data
7. Implement /history with real data
8. Add circuit breakers to all external API clients
9. Comprehensive error handling pass
10. Update all docs

**Deliverables**: Polished, configurable experience.

### Phase 8: Testing & Deployment (Days 50-56)

**Goal**: Production-ready deployment

**Tasks**:
1. Write unit tests for critical services
2. Write integration tests for full pipeline
3. Write E2E tests for Discord interactions
4. Set up CI/CD (GitHub Actions)
5. Set up production infrastructure
6. Deploy to production
7. Monitor and fix issues
8. Final docs pass — ensure all docs match reality

**Deliverables**: Deployed, tested, production MVP.

---

## 30. APPENDIX: CRITICAL DECISIONS & RATIONALE

### Decision 001: TypeScript over Python
**Why**: discord.js is the most mature Discord library. TypeScript provides type safety that prevents entire categories of bugs in a complex system with many data types. Node.js is ideal for I/O-bound workloads (which this entirely is).

### Decision 002: Modular Monolith over Microservices
**Why**: For a solo developer using AI agents, a single deployable unit is dramatically simpler to develop, debug, and deploy. The code is organized into modules with clear boundaries that can be extracted into microservices later if needed.

### Decision 003: BullMQ over Simple setInterval
**Why**: Reliable job processing is critical. BullMQ provides: persistence (survives restarts), retry with backoff, rate limiting, concurrency control, delayed jobs, repeatable jobs, and dead letter queues. setInterval provides none of these.

### Decision 004: PostgreSQL over MongoDB
**Why**: Relational integrity (User → Account → Match → Clip). ACID transactions for status updates. Prisma provides excellent TypeScript types. PostgreSQL performs well and is widely supported by hosting providers.

### Decision 005: Fastify over Express
**Why**: Fastify is faster (lower overhead per request), has built-in TypeScript support, schema-based validation, and a cleaner plugin system. For our minimal web server, it's the right choice.

### Decision 006: Polling over Pure Webhooks for Match Detection
**Why**: No game platform (Steam, Riot, Epic) provides webhooks for match completion. Polling is the only option. The system is designed to use Allstar webhooks when available for clip status, falling back to polling.

### Decision 007: DM Delivery over Channel Delivery as Default
**Why**: Gaming highlights are personal. Users want their clips privately, not broadcasted. DM is the default with optional server feed as opt-in.

### Decision 008: Separate PollState Table
**Why**: Poll state updates every 30-90 seconds per user-game pair. This would cause excessive write amplification on the LinkedAccount table. A separate table with its own indexes optimizes this hot path.

### Decision 009: Encrypted Token Storage
**Why**: OAuth tokens are sensitive credentials. If the database is compromised, encrypted tokens cannot be used without the encryption key (which is only in environment variables, never in the DB).

### Decision 010: Apply for Allstar Partner API Early
**Why**: The partner API requires application and approval. This is the critical dependency of the entire project. If approval takes weeks, development on other components can proceed in parallel with mocked Allstar responses.

### Decision 011: Feature Flags for Games
**Why**: Fortnite integration is less mature than CS2/LoL. Feature flags allow disabling games without code changes. This also enables gradual rollout — launch with CS2 only, add LoL, etc.

### Decision 012: docs/ Mirror Structure for AI Agents
**Why**: AI agents (Claude Code, Codex) work best when they can quickly load relevant context without reading entire codebases. The docs/ folder serves as a pre-digested context layer that describes intent, contracts, and logic — enabling agents to understand modules faster and maintain consistency across sessions.

---

## END OF BLUEPRINT

This document is the single source of truth for ClipVault's architecture. Every implementation decision should trace back to a section in this blueprint. When reality diverges from the blueprint (which it will), update both the code AND this document.

**Next Steps**:
1. Apply for Allstar Partner API access at developer.allstar.gg (DO THIS NOW)
2. Apply for Riot Games production API key at developer.riotgames.com
3. Get Steam Web API key from steamcommunity.com/dev/apikey
4. Begin Phase 0: Foundation

**Remember**: The goal is a fully functional, automatically deployed MVP that delivers real clips to real gamers. No half-finished product.


