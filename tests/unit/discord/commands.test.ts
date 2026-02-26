import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as commands from '../../../src/discord/commands.js';

describe('Discord Commands', () => {
  describe('Command Exports', () => {
    it('should export linkCommand', () => {
      expect(commands.linkCommand).toBeDefined();
    });

    it('should export unlinkCommand', () => {
      expect(commands.unlinkCommand).toBeDefined();
    });

    it('should export settingsCommand', () => {
      expect(commands.settingsCommand).toBeDefined();
    });

    it('should export statusCommand', () => {
      expect(commands.statusCommand).toBeDefined();
    });

    it('should export historyCommand', () => {
      expect(commands.historyCommand).toBeDefined();
    });

    it('should export helpCommand', () => {
      expect(commands.helpCommand).toBeDefined();
    });

    it('should export allCommands array', () => {
      expect(commands.allCommands).toBeDefined();
      expect(Array.isArray(commands.allCommands)).toBe(true);
      expect(commands.allCommands.length).toBe(6);
    });
  });
});
