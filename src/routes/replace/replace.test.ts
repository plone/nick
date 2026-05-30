/**
 * Replace tests.
 * @module routes/replace/replace
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Replace', () => {
  it('should replace text', () => testRequest(app, 'replace/post'));
});
