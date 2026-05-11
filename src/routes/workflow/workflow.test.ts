/**
 * Workflow tests.
 * @module routes/workflow/workflow
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Workflow', () => {
  it('should return the workflow', () => testRequest(app, 'workflow/get'));

  it('should change a workflow state', async () => {
    await testRequest(app, 'content/post');
    return testRequest(app, 'workflow/post');
  });
});
