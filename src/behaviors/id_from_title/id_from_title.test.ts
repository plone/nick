/**
 * ID from title behavior tests.
 * @module behaviors/id_from_title/id_from_title.test
 */

// External imports
import { describe, it, expect } from 'vitest';

// Internal imports
import { id_from_title } from './id_from_title';

describe('id_from_title', () => {
  describe('setId', () => {
    it('uses provided id when not in blacklist', () => {
      const doc = { id: '', json: { title: 'My Title' } };
      id_from_title.setId.call(doc, 'my-id', ['other']);
      expect(doc.id).toBe('my-id');
    });

    it('appends counter when id is in blacklist', () => {
      const doc = { id: '', json: { title: 'My Title' } };
      id_from_title.setId.call(doc, 'my-id', ['my-id']);
      expect(doc.id).toBe('my-id-1');
    });

    it('slugifies title when id is not provided', () => {
      const doc = { id: '', json: { title: 'My Title! @Test' } };
      id_from_title.setId.call(doc);
      expect(doc.id).toBe('my-title-test');
    });
  });
});
