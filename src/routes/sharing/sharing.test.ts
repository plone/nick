/**
 * Sharing tests.
 * @module routes/sharing/sharing
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Sharing', () => {
  it('should get sharing information', () => testRequest(app, 'sharing/get'));

  it('should get sharing information with search', () =>
    testRequest(app, 'sharing/get_search'));

  it('should set new sharing information', () =>
    testRequest(app, 'sharing/post'));
});
