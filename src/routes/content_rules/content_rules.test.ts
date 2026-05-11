/**
 * Content Rules tests.
 * @module routes/content_rules/content_rules
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Content Rules', () => {
  it('should return the content rules', () =>
    testRequest(app, 'content_rules/get'));

  it('should create a content rule', () =>
    testRequest(app, 'content_rules/post'));

  it('should enable a content rule', () =>
    testRequest(app, 'content_rules/patch_enable'));

  it('should disable a content rule', () =>
    testRequest(app, 'content_rules/patch_disable'));

  it('should bubble a content rule', () =>
    testRequest(app, 'content_rules/patch_bubble'));

  it('should not bubble a content rule', () =>
    testRequest(app, 'content_rules/patch_nobubble'));

  it('should delete a content rule', () =>
    testRequest(app, 'content_rules/delete'));
});
