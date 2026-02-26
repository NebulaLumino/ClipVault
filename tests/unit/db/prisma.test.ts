import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../../src/db/prisma.js';

describe('Prisma Client', () => {
  describe('prisma', () => {
    it('should have $connect method', () => {
      expect(prisma).toBeDefined();
      expect(typeof prisma.$connect).toBe('function');
    });

    it('should have $disconnect method', () => {
      expect(typeof prisma.$disconnect).toBe('function');
    });

    it('should have user model', () => {
      expect(prisma.user).toBeDefined();
    });

    it('should have linkedAccount model', () => {
      expect(prisma.linkedAccount).toBeDefined();
    });

    it('should have matchRecord model', () => {
      expect(prisma.matchRecord).toBeDefined();
    });

    it('should have clipRecord model', () => {
      expect(prisma.clipRecord).toBeDefined();
    });

    it('should have deliveryRecord model', () => {
      expect(prisma.deliveryRecord).toBeDefined();
    });
  });
});
