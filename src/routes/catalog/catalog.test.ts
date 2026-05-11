/**
 * Catalog tests.
 * @module routes/catalog/catalog
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Catalog', () => {
  it('should return the catalog info', () => testRequest(app, 'catalog/get'));
});
