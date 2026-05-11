/**
 * Site tests.
 * @module routes/site/site
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Site', () => {
  it('should get the site information', () => testRequest(app, 'site/get'));
});
