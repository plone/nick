/**
 * Navroot tests.
 * @module routes/navroot/navroot
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Navroot', () => {
  it('should get the navroot', () => testRequest(app, 'navroot/get'));
});
