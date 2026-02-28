# BLUEPRINT-v2.md — ClipVault: Revised Implementation Plan

> **Version**: 2.0.0
> **Last Updated**: 2025-02-27
> **Status**: Implementation Guide
> **Based on**: BLUEPRINT.md v1.0.0-DRAFT

---

## 1. Executive Summary

The current implementation in `src/` is a simplified MVP that does not match the architectural vision defined in BLUEPRINT.md. The codebase is not modular, lacks proper separation of concerns, and is missing critical components.

**This document outlines the comprehensive re-implementation plan.**

---

## 2. Gap Analysis Summary

### Current State vs Blueprint

| Category           | Current Files | Required Files | Gap                            |
| ------------------ | ------------- | -------------- | ------------------------------ |
| Config             | 1             | 3              | Missing constants.ts, games.ts |
| Database Repos     | 0             | 7              | All missing                    |
| Services           | 5 monolithic  | 30+ modular    | Need complete split            |
| Discord Events     | 0             | 3              | All missing                    |
| Discord Components | 0             | 2              | All missing                    |
| Discord Embeds     | 0             | 4              | All missing                    |
| Web Routes         | 1             | 7+             | Need expansion                 |
| Web Middleware     | 0             | 2              | All missing                    |
| Pollers            | 0             | 5              | All missing                    |
| Integration Types  | 0             | 8+             | All missing                    |
| Utilities          | 1             | 8              | 7 missing                      |
| Docs               | 0             | All            | All missing                    |

---

## 3. Implementation Phases

### Phase 1: Foundation

1. Create `src/config/constants.ts` - Application-wide constants
2. Create `src/config/games.ts` - Game definitions
3. Create `src/db/repositories/` - All 7 repositories
4. Update `src/config/index.ts` to export new configs

### Phase 2: Service Modularization

5. Split Account services
6. Split Match services + add pollers
7. Split Clip services
8. Split Delivery services
9. Create Preferences service

### Phase 3: Infrastructure

10. Add missing utilities (errors, retry, rateLimit, steamId, crypto, time, validation)
11. Add integration types and auth files
12. Add job schedulers

### Phase 4: Discord & Web

13. Expand Discord module (events, components, embeds)
14. Expand Web module (routes, middleware)

### Phase 5: Documentation

15. Create `docs/` mirror folder

---

## 4. Naming Conventions

### Service Classes

- Use `Service` suffix: `AccountLinkService`, `MatchDetectionService`
- Use `Engine` suffix for orchestration: `DeliveryEngine`, `ClipOrchestrator`
- Use `Client` suffix for API clients: `SteamClient`, `RiotClient`
- Use `Worker` suffix for BullMQ workers

### Repository Classes

- Use `Repository` suffix: `UserRepository`, `MatchRepository`

### File Naming

- PascalCase for all TypeScript files
- Descriptive names: `matchDetection.worker.ts`, `BasePoller.ts`

---

## 5. Key Architectural Decisions

### Repository Pattern

All database access MUST go through repositories. Services NEVER use `prisma.*` directly.

### Poller Pattern

All pollers MUST extend `BasePoller` and implement:

- `poll(linkedAccount, pollState): Promise<DetectedMatch[]>`
- `game: Game` property

### Service Injection

Services should be singleton instances exported from their files:

```typescript
export const accountLinkService = new AccountLinkService();
```

### Error Handling

All services should use custom error classes from `src/utils/errors.ts`

---

## 6. File Structure Target

```
src/
├── config/
│   ├── index.ts
│   ├── constants.ts
│   └── games.ts
├── core/
│   ├── discord/
│   │   ├── client.ts
│   │   ├── events/
│   │   │   ├── ready.ts
│   │   │   ├── interactionCreate.ts
│   │   │   └── guildCreate.ts
│   │   ├── commands/
│   │   │   ├── index.ts
│   │   │   ├── link.ts
│   │   │   ├── unlink.ts
│   │   │   ├── settings.ts
│   │   │   ├── status.ts
│   │   │   ├── history.ts
│   │   │   ├── setup.ts
│   │   │   └── help.ts
│   │   ├── components/
│   │   │   ├── buttons.ts
│   │   │   └── selectMenus.ts
│   │   └── embeds/
│   │       ├── matchSummary.ts
│   │       ├── clipCard.ts
│   │       ├── accountInfo.ts
│   │       └── onboarding.ts
│   └── web/
│       ├── server.ts
│       ├── routes/
│       │   ├── auth/
│       │   │   ├── steam.ts
│       │   │   ├── riot.ts
│       │   │   ├── epic.ts
│       │   │   └── discord.ts
│       │   ├── webhooks/
│       │   │   └── allstar.ts
│       │   └── health.ts
│       └── middleware/
│           ├── auth.ts
│           └── rateLimit.ts
├── services/
│   ├── account/
│   │   ├── AccountLinkService.ts
│   │   ├── AccountSyncService.ts
│   │   └── AccountValidationService.ts
│   ├── match/
│   │   ├── MatchDetectionService.ts
│   │   ├── pollers/
│   │   │   ├── BasePoller.ts
│   │   │   ├── CS2Poller.ts
│   │   │   ├── LoLPoller.ts
│   │   │   ├── Dota2Poller.ts
│   │   │   └── FortnitePoller.ts
│   │   └── MatchRecordService.ts
│   ├── clip/
│   │   ├── ClipOrchestrator.ts
│   │   ├── ClipRequestService.ts
│   │   ├── ClipMonitorService.ts
│   │   ├── ClipFetchService.ts
│   │   └── ClipFilterService.ts
│   ├── delivery/
│   │   ├── DeliveryEngine.ts
│   │   ├── MessageFormatter.ts
│   │   ├── DMDispatcher.ts
│   │   └── ChannelPoster.ts
│   └── preferences/
│       ├── PreferenceService.ts
│       └── defaults.ts
├── integrations/
│   ├── allstar/
│   │   ├── AllstarClient.ts
│   │   ├── AllstarTypes.ts
│   │   ├── AllstarWebhookHandler.ts
│   │   └── AllstarErrors.ts
│   ├── steam/
│   │   ├── SteamClient.ts
│   │   ├── SteamTypes.ts
│   │   └── SteamAuth.ts
│   ├── riot/
│   │   ├── RiotClient.ts
│   │   ├── RiotTypes.ts
│   │   └── RiotAuth.ts
│   ├── epic/
│   │   ├── EpicClient.ts
│   │   ├── EpicTypes.ts
│   │   └── EpicAuth.ts
│   └── opendota/
│       ├── OpenDotaClient.ts
│       └── OpenDotaTypes.ts
├── jobs/
│   ├── queue.ts
│   ├── workers/
│   │   ├── matchDetection.worker.ts
│   │   ├── clipRequest.worker.ts
│   │   ├── clipMonitor.worker.ts
│   │   ├── clipDeliver.worker.ts
│   │   └── accountSync.worker.ts
│   └── schedulers/
│       └── matchPollScheduler.ts
├── database/
│   ├── prisma.ts
│   └── repositories/
│       ├── UserRepository.ts
│       ├── LinkedAccountRepository.ts
│       ├── MatchRepository.ts
│       ├── ClipRepository.ts
│       ├── DeliveryRepository.ts
│       ├── PreferenceRepository.ts
│       └── GuildConfigRepository.ts
├── utils/
│   ├── logger.ts
│   ├── errors.ts
│   ├── retry.ts
│   ├── rateLimit.ts
│   ├── steamId.ts
│   ├── crypto.ts
│   ├── time.ts
│   └── validation.ts
├── types/
│   └── index.ts
└── index.ts
```

---

## 7. Implementation Order

**CRITICAL**: Implementation must follow this exact order to maintain dependencies:

1. Config files (constants, games)
2. Database repositories
3. Utilities
4. Integration clients + types
5. Services (split)
6. Jobs (workers + schedulers)
7. Discord module
8. Web module
9. Entry point
10. Documentation

---

## 8. Backward Compatibility

The refactoring MUST maintain backward compatibility with:

- Prisma schema (`prisma/schema.prisma`)
- Job data types in `src/types/index.ts`
- Environment variables in `.env.example`
- Discord command structure

---

## 9. Testing Requirements

Each new service/repository must have:

- Unit tests in `tests/unit/`
- Follow existing test patterns in the codebase
- Maintain or improve code coverage

---

## 10. Notes for Implementation

- Keep services focused and small (< 100 lines each)
- Use dependency injection where possible
- All async operations must have proper error handling
- Use the logger from `src/utils/logger.ts` for all logging
- Never expose raw Prisma types outside repositories
