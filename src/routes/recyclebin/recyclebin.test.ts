/**
 * Recyclebin tests.
 * @module routes/recyclebin/recyclebin
 */

// External imports
import { afterEach, describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Recyclebin', () => {
  it('should get a list of recyclebin items', () =>
    testRequest(app, 'recyclebin/list'));

  it('should get an individual recyclebin item', () =>
    testRequest(app, 'recyclebin/get'));

  it('should restore a recyclebin item', () =>
    testRequest(app, 'recyclebin/post'));

  it('should restore a recyclebin item with a target path', () =>
    testRequest(app, 'recyclebin/post_target'));

  it('should purge a recyclebin item', () =>
    testRequest(app, 'recyclebin/delete'));

  it('should purge all recyclebin items', () =>
    testRequest(app, 'recyclebin/delete_all'));
});
