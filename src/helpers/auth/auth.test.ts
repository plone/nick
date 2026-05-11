/**
 * Auth helper tests.
 * @module helpers/auth/auth.test
 */

// Type imports
import type { Request, User } from '../../types';

// External imports
import jwt from 'jsonwebtoken';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Internal imports
import * as configModule from '../config/config';
import { hasPermission, getUserId, addToken, removeToken } from './auth';

describe('Auth', () => {
  const testSecret = 'test-secret-key';

  beforeEach(() => {
    vi.spyOn(configModule, 'default', 'get').mockReturnValue({
      settings: {
        secret: testSecret,
      },
    } as any);
  });

  describe('hasPermission', () => {
    it('should return true when permission is undefined', () => {
      expect(hasPermission(['admin', 'editor'], undefined as any)).toBe(true);
    });

    it('should return true when user has the required permission', () => {
      expect(hasPermission(['admin', 'editor'], 'admin')).toBe(true);
    });

    it('should return false when user lacks the required permission', () => {
      expect(hasPermission(['editor', 'viewer'], 'admin')).toBe(false);
    });

    it('should return false for empty permissions array', () => {
      expect(hasPermission([], 'admin')).toBe(false);
    });

    it('should return true when checking for permission in the middle of array', () => {
      expect(hasPermission(['viewer', 'editor', 'admin'], 'editor')).toBe(true);
    });
  });

  describe('getUserId', () => {
    it('should return "anonymous" when no token is present', () => {
      const req = {} as Request;
      expect(getUserId(req)).toBe('anonymous');
    });

    it('should return "anonymous" when token is invalid', () => {
      const req = { token: 'invalid.token.here' } as Request;
      expect(getUserId(req)).toBe('anonymous');
    });

    it('should return "anonymous" when token uses wrong algorithm', () => {
      const token = jwt.sign({ sub: 'testuser' }, testSecret, {
        algorithm: 'RS256',
      });
      const req = { token } as Request;
      expect(getUserId(req)).toBe('anonymous');
    });

    it('should return undefined when sub is not a string', () => {
      vi.spyOn(jwt, 'verify').mockReturnValueOnce({ sub: 123 } as any);
      const req = { token: 'any-token' } as Request;
      expect(getUserId(req)).toBeUndefined();
    });
  });

  describe('addToken', () => {
    it('should add a new token to user', async () => {
      const updateSpy = vi.fn().mockResolvedValue(undefined);
      const user = {
        tokens: [],
        update: updateSpy,
      } as unknown as User;
      const token = jwt.sign({ sub: 'testuser' }, testSecret);
      const trx = {} as any;

      await addToken(user, token, trx);

      expect(updateSpy).toHaveBeenCalledWith({ tokens: [token] }, trx);
    });

    it('should initialize tokens array if undefined', async () => {
      const updateSpy = vi.fn().mockResolvedValue(undefined);
      const user = {
        tokens: undefined,
        update: updateSpy,
      } as unknown as User;
      const token = jwt.sign({ sub: 'testuser' }, testSecret);
      const trx = {} as any;

      await addToken(user, token, trx);

      expect(updateSpy).toHaveBeenCalledWith({ tokens: [token] }, trx);
    });

    it('should filter out expired tokens before adding a new one', async () => {
      const updateSpy = vi.fn().mockResolvedValue(undefined);
      const expiredToken = 'expired-token-that-will-fail-verify';
      const user = {
        tokens: [expiredToken],
        update: updateSpy,
      } as unknown as User;
      const token = jwt.sign({ sub: 'testuser' }, testSecret);
      const trx = {} as any;

      await addToken(user, token, trx);

      expect(updateSpy).toHaveBeenCalledWith({ tokens: [token] }, trx);
    });
  });

  describe('removeToken', () => {
    it('should initialize tokens array if undefined', async () => {
      const updateSpy = vi.fn().mockResolvedValue(undefined);
      const user = {
        tokens: undefined,
        update: updateSpy,
      } as unknown as User;
      const token = jwt.sign({ sub: 'testuser' }, testSecret);
      const trx = {} as any;

      await removeToken(user, token, trx);

      expect(updateSpy).toHaveBeenCalledWith({ tokens: [] }, trx);
    });

    it('should handle removing non-existent token', async () => {
      const updateSpy = vi.fn().mockResolvedValue(undefined);
      const token1 = jwt.sign({ sub: 'user1' }, testSecret);
      const user = {
        tokens: [token1],
        update: updateSpy,
      } as unknown as User;
      const trx = {} as any;

      await removeToken(user, 'non-existent-token', trx);

      expect(updateSpy).toHaveBeenCalledWith({ tokens: [token1] }, trx);
    });

    it('should clear all tokens when removing last one', async () => {
      const updateSpy = vi.fn().mockResolvedValue(undefined);
      const token1 = jwt.sign({ sub: 'user1' }, testSecret);
      const user = {
        tokens: [token1],
        update: updateSpy,
      } as unknown as User;
      const trx = {} as any;

      await removeToken(user, token1, trx);

      expect(updateSpy).toHaveBeenCalledWith({ tokens: [] }, trx);
    });
  });
});
