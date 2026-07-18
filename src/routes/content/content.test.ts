/**
 * Content tests.
 * @module routes/content/content
 */

// External imports
import { v4 as uuid } from 'uuid';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Content', () => {
  beforeEach(() => {
    const mockDate = new Date(Date.UTC(2022, 0, 1));
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a content object', () => testRequest(app, 'content/get'));

  it('should add a content object', () => testRequest(app, 'content/post'));

  it('should update a content object', async () => {
    await testRequest(app, 'content/post');
    return testRequest(app, 'content/patch');
  });

  it('should delete a content object', async () => {
    await testRequest(app, 'content/post');
    return testRequest(app, 'content/delete');
  });

  it('should return not found when content not found', () =>
    testRequest(app, 'content/get_notfound'));

  it('should return bad request when required field is missing', () =>
    testRequest(app, 'content/post_badrequest'));

  it('should be able to handle reordering of content', async () => {
    await testRequest(app, 'content/post');
    return testRequest(app, 'content/patch_reorder');
  });

  it('should copy a content object', () => testRequest(app, 'copymove/copy'));

  it('should move a content object', () => testRequest(app, 'copymove/move'));

  /*
  it('should copy multiple content objects', () => {
    // Mock uuid
    let i = 0;
    // @ts-expect-error Mock implementation does not match type definition, but it is only used in tests
    vi.mocked(uuid).mockImplementation(() => {
      i = i + 1;
      return `a95388f2-e4b3-4292-98aa-62656cbd5b9${i}`;
    });

    return testRequest(app, 'copymove/copy_multiple');
  });
  */

  it('should export a content object', () =>
    testRequest(app, 'content/export'));

  it('should export a content object with an inline disposition', () =>
    testRequest(app, 'content/export_inline'));

  it('should export an ics file for a content object', () =>
    testRequest(app, 'content/ics'));

  it('should export an ics file for a folder object', () =>
    testRequest(app, 'content/ics_folder'));

  it('should export a rss file for a folder object', () =>
    testRequest(app, 'content/rss'));

  it('should export a markdown file for an object', () =>
    testRequest(app, 'content/markdown'));
});
