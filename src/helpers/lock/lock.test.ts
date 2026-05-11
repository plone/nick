/**
 * Lock helper tests.
 * @module helpers/lock/lock.test
 */

// External imports
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Internal imports
import { lockExpired } from './lock';

describe('lockExpired', () => {
  const FIXED_TIMESTAMP = 1649433600000;

  it('should return true when lock is expired', () => {
    // Lock created 120 seconds ago with 60 second timeout = expired
    const document = {
      lock: {
        created: (FIXED_TIMESTAMP - 120) * 1000,
        timeout: 60,
      },
    };

    expect(lockExpired(document)).toBe(true);
  });

  it('should return false when lock is not expired', () => {
    // Lock created just now with 60 second timeout = not expired
    const document = {
      lock: {
        created: FIXED_TIMESTAMP * 1000,
        timeout: 60,
      },
    };

    expect(lockExpired(document)).toBe(false);
  });
});
