/**
 * Type model tests.
 * @module models/type/type.test
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import { Type } from './type';

describe('Type', () => {
  it('should cache schema', async () => {
    const type = await Type.fetchById('Page');
    await type.cacheSchema();
  });
});
