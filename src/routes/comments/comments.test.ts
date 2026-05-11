/**
 * Comments tests.
 * @module routes/comments/comments
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Comments', () => {
  it('should return the comments', () => testRequest(app, 'comments/get'));

  it('should add a comment', () => testRequest(app, 'comments/post'));

  it('should reply to a comment', () =>
    testRequest(app, 'comments/post_reply'));

  it('should update a comment', () => testRequest(app, 'comments/patch'));

  it('should delete a comment', () => testRequest(app, 'comments/delete'));
});
