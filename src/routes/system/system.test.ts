/**
 * System tests.
 * @module routes/system/system
 */

// External imports
import { describe, it, vi } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

// Mock getNodeVersion
vi.mock('../../helpers/utils/utils', async () => {
  const originalModule = await vi.importActual('../../helpers/utils/utils.ts');
  return {
    __esModule: true,
    ...originalModule,
    getNodeVersion: () => 'v26.1.0',
  };
});

// Mock getPostgresVersion
vi.mock('../../helpers/knex/knex', async () => {
  const originalModule = await vi.importActual('../../helpers/knex/knex');
  return {
    __esModule: true,
    ...originalModule,
    getPostgresVersion: () => '18.3',
  };
});

describe('System', () => {
  it('should get the system information', () => testRequest(app, 'system/get'));
});
