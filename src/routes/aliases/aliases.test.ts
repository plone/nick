/**
 * Aliases tests.
 * @module routes/aliases/aliases
 */

// External imports
import { describe, it, afterEach } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Aliases', () => {
  afterEach(async () => {
    await testRequest(app, 'aliases/delete');
  });

  it('should get a list of aliases', async () => {
    await testRequest(app, 'aliases/post_root');
    return testRequest(app, 'aliases/list');
  });

  it('should get a list of aliases in the root', async () => {
    await testRequest(app, 'aliases/post_root');
    return testRequest(app, 'aliases/list_root');
  });

  it('should get a list of aliases with a search query', async () => {
    await testRequest(app, 'aliases/post_root');
    return testRequest(app, 'aliases/list_query');
  });

  it('should add a new alias', () => testRequest(app, 'aliases/post'));

  it('should add a new alias in bulk', () =>
    testRequest(app, 'aliases/post_root'));

  it('should delete an alias', async () => {
    await testRequest(app, 'aliases/post');
    return testRequest(app, 'aliases/delete');
  });
});
