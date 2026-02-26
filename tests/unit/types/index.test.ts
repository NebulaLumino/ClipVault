import { describe, it, expect } from 'vitest';
import {
  GamePlatform,
  GameTitle,
  PlatformType,
  AccountLinkStatus,
  MatchStatus,
  ClipStatus,
  ClipType,
  DeliveryMethod,
  DeliveryStatus,
  type UserPreferences,
  type LinkedAccount,
  type PollState,
  type MatchRecord,
  type ClipRecord,
  type DeliveryRecord,
  type MatchPollJobData,
  type ClipRequestJobData,
  type ClipMonitorJobData,
  type ClipDeliveryJobData,
  type MatchInfo,
} from '../../../src/types/index.js';

describe('Types', () => {
  describe('Enums', () => {
    it('should have correct GamePlatform values', () => {
      expect(GamePlatform.CS2).toBe('cs2');
      expect(GamePlatform.LEAGUE_OF_LEGENDS).toBe('lol');
      expect(GamePlatform.DOTA2).toBe('dota2');
      expect(GamePlatform.FORTNITE).toBe('fortnite');
    });

    it('should have correct GameTitle values', () => {
      expect(GameTitle.CS2).toBe('Counter-Strike 2');
      expect(GameTitle.LOL).toBe('League of Legends');
      expect(GameTitle.DOTA2).toBe('Dota 2');
      expect(GameTitle.FORTNITE).toBe('Fortnite');
    });

    it('should have correct PlatformType values', () => {
      expect(PlatformType.STEAM).toBe('steam');
      expect(PlatformType.RIOT).toBe('riot');
      expect(PlatformType.EPIC).toBe('epic');
      expect(PlatformType.DISCORD).toBe('discord');
    });

    it('should have correct AccountLinkStatus values', () => {
      expect(AccountLinkStatus.PENDING).toBe('pending');
      expect(AccountLinkStatus.LINKED).toBe('linked');
      expect(AccountLinkStatus.EXPIRED).toBe('expired');
      expect(AccountLinkStatus.ERROR).toBe('error');
    });

    it('should have correct MatchStatus values', () => {
      expect(MatchStatus.DETECTED).toBe('detected');
      expect(MatchStatus.PROCESSING).toBe('processing');
      expect(MatchStatus.COMPLETED).toBe('completed');
      expect(MatchStatus.FAILED).toBe('failed');
      expect(MatchStatus.EXPIRED).toBe('expired');
    });

    it('should have correct ClipStatus values', () => {
      expect(ClipStatus.REQUESTED).toBe('requested');
      expect(ClipStatus.PROCESSING).toBe('processing');
      expect(ClipStatus.READY).toBe('ready');
      expect(ClipStatus.DELIVERED).toBe('delivered');
      expect(ClipStatus.FAILED).toBe('failed');
      expect(ClipStatus.EXPIRED).toBe('expired');
    });

    it('should have correct ClipType values', () => {
      expect(ClipType.HIGHLIGHT).toBe('highlight');
      expect(ClipType.PLAY_OF_THE_GAME).toBe('play_of_the_game');
      expect(ClipType.MOMENT).toBe('moment');
      expect(ClipType.KILL).toBe('kill');
      expect(ClipType.DEATH).toBe('death');
      expect(ClipType.ASSIST).toBe('assist');
      expect(ClipType.ACE).toBe('ace');
      expect(ClipType.CLUTCH).toBe('clutch');
    });

    it('should have correct DeliveryMethod values', () => {
      expect(DeliveryMethod.DM).toBe('dm');
      expect(DeliveryMethod.CHANNEL).toBe('channel');
    });

    it('should have correct DeliveryStatus values', () => {
      expect(DeliveryStatus.PENDING).toBe('pending');
      expect(DeliveryStatus.SENT).toBe('sent');
      expect(DeliveryStatus.FAILED).toBe('failed');
    });
  });

  describe('Interfaces', () => {
    it('should have correct UserPreferences shape', () => {
      const prefs: UserPreferences = {
        userId: '123',
        deliveryMethod: DeliveryMethod.DM,
        quietHoursEnabled: false,
        preferredClipTypes: [ClipType.HIGHLIGHT],
        notificationsEnabled: true,
      };
      expect(prefs.userId).toBe('123');
      expect(prefs.deliveryMethod).toBe('dm');
    });

    it('should have correct LinkedAccount shape', () => {
      const account: LinkedAccount = {
        id: '1',
        userId: '123',
        platform: PlatformType.STEAM,
        platformAccountId: '76561198000000000',
        platformUsername: 'TestUser',
        status: AccountLinkStatus.LINKED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(account.platform).toBe(PlatformType.STEAM);
      expect(account.status).toBe(AccountLinkStatus.LINKED);
    });

    it('should have correct MatchRecord shape', () => {
      const match: MatchRecord = {
        id: '1',
        userId: '123',
        platform: PlatformType.STEAM,
        gameTitle: GamePlatform.CS2,
        matchId: 'match123',
        platformMatchId: 'platform123',
        status: MatchStatus.DETECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(match.gameTitle).toBe(GamePlatform.CS2);
      expect(match.status).toBe(MatchStatus.DETECTED);
    });

    it('should have correct ClipRecord shape', () => {
      const clip: ClipRecord = {
        id: '1',
        matchId: 'match1',
        userId: '123',
        allstarClipId: 'clip123',
        type: ClipType.HIGHLIGHT,
        status: ClipStatus.READY,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(clip.type).toBe(ClipType.HIGHLIGHT);
      expect(clip.status).toBe(ClipStatus.READY);
    });

    it('should have correct DeliveryRecord shape', () => {
      const delivery: DeliveryRecord = {
        id: '1',
        clipId: 'clip1',
        userId: '123',
        recipientId: '123',
        method: DeliveryMethod.DM,
        status: DeliveryStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(delivery.method).toBe(DeliveryMethod.DM);
    });

    it('should have correct MatchPollJobData shape', () => {
      const jobData: MatchPollJobData = {
        linkedAccountId: 'acc1',
        platform: PlatformType.STEAM,
        platformAccountId: '12345678',
      };
      expect(jobData.platform).toBe(PlatformType.STEAM);
    });

    it('should have correct ClipRequestJobData shape', () => {
      const jobData: ClipRequestJobData = {
        matchId: 'match1',
        userId: '123',
        platform: PlatformType.STEAM,
        platformMatchId: 'pmatch1',
      };
      expect(jobData.platform).toBe(PlatformType.STEAM);
    });

    it('should have correct ClipMonitorJobData shape', () => {
      const jobData: ClipMonitorJobData = {
        matchId: 'match1',
        clipRequestId: 'req1',
      };
      expect(jobData.matchId).toBe('match1');
    });

    it('should have correct ClipDeliveryJobData shape', () => {
      const jobData: ClipDeliveryJobData = {
        clipId: 'clip1',
        userId: '123',
        matchId: 'match1',
      };
      expect(jobData.clipId).toBe('clip1');
    });

    it('should have correct MatchInfo shape', () => {
      const info: MatchInfo = {
        matchId: 'match1',
        matchtime: 1234567890,
        result: 'win',
      };
      expect(info.matchId).toBe('match1');
      expect(info.result).toBe('win');
    });
  });
});
