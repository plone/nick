/**
 * Push helper tests.
 * @module helpers/push/push.test
 */

// External imports
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Internal imports
import { sendPush } from './push';
import * as configModule from '../config/config';

describe('Push', () => {
  beforeEach(() => {
    vi.spyOn(configModule, 'default', 'get').mockReturnValue({
      settings: {
        push: {
          url: 'https://example.com/push',
          user: 'admin',
          password: 'admin',
        },
      },
    } as any);
  });

  describe('sendPush', () => {
    it('should send push request with auth header when user and password are set', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchSpy;

      await sendPush('GET', '/api/items/1', { title: 'Test' });

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/push',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Basic YWRtaW46YWRtaW4=',
          }),
        }),
      );
    });

    it('should send push request without auth header when user/password are missing', async () => {
      vi.spyOn(configModule, 'default', 'get').mockReturnValue({
        settings: {
          push: {
            url: 'https://example.com/push',
          },
        },
      } as any);

      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchSpy;

      await sendPush('POST', '/api/items', { title: 'Test' });

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/push',
        expect.objectContaining({
          method: 'POST',
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        }),
      );
    });
  });
});
