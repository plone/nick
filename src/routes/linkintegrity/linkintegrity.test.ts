/**
 * Linkintegrity tests.
 * @module routes/linkintegrity/linkintegrity
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Linkintegrity', () => {
  it('should return the linkintegrity', () =>
    testRequest(app, 'linkintegrity/get'));
});
