/**
 * Schema helper tests.
 * @module helpers/schema/schema.test
 */

// Type imports
import type { Request, Schema } from '../../types';

// External imports
import { describe, it, expect, vi } from 'vitest';

// Internal imports
import { mergeSchemas, translateSchema, schemaToHtml } from './schema';

describe('schema', () => {
  describe('mergeSchemas', () => {
    it('merges fieldsets from multiple schemas', () => {
      const schemas: { name: string; data: Schema }[] = [
        {
          name: 'schema1',
          data: {
            fieldsets: [{ id: 'default', title: 'Default', fields: ['title'] }],
            properties: { title: { title: 'Title' } },
          },
        },
        {
          name: 'schema2',
          data: {
            fieldsets: [
              { id: 'default', title: 'Default', fields: ['description'] },
            ],
            properties: { description: { title: 'Description' } },
          },
        },
      ];
      const result = mergeSchemas(...schemas);
      expect(result.fieldsets[0].fields).toEqual(['title', 'description']);
      expect(result.fieldsets[0].behavior).toBe('schema1');
    });

    it('adds new fieldset if not existing', () => {
      const schemas: { name: string; data: Schema }[] = [
        {
          name: 'schema1',
          data: {
            fieldsets: [{ id: 'custom', title: 'Custom', fields: ['extra'] }],
            properties: {},
          },
        },
      ];
      const result = mergeSchemas(...schemas);
      expect(result.fieldsets).toHaveLength(1);
      expect(result.fieldsets[0].id).toBe('custom');
    });

    it('merges properties, required, behaviors, and layouts', () => {
      const schemas: { name: string; data: Schema }[] = [
        {
          name: 'schema1',
          data: {
            fieldsets: [{ id: 'default', title: 'Default', fields: ['title'] }],
            properties: { title: { title: 'Title' } },
            required: ['title'],
            behaviors: ['behavior1'],
            layouts: ['layout1'],
          },
        },
        {
          name: 'schema2',
          data: {
            fieldsets: [
              { id: 'default', title: 'Default', fields: ['description'] },
            ],
            properties: { description: { title: 'Description' } },
            required: ['description'],
            behaviors: ['behavior2'],
            layouts: ['layout2'],
          },
        },
      ];
      const result = mergeSchemas(...schemas);
      expect(result.properties).toHaveProperty('title');
      expect(result.properties).toHaveProperty('description');
      expect(result.properties!['title'].behavior).toBe('schema1');
      expect(result.required).toEqual(['title', 'description']);
      expect(result.behaviors).toEqual(['behavior1', 'behavior2']);
      expect(result.layouts).toEqual(['layout1', 'layout2']);
    });

    it('omits behaviors and layouts when empty', () => {
      const schemas: { name: string; data: Schema }[] = [
        {
          name: 'schema1',
          data: {
            fieldsets: [{ id: 'default', title: 'Default', fields: ['title'] }],
            properties: { title: { title: 'Title' } },
          },
        },
      ];
      const result = mergeSchemas(...schemas);
      expect(result.behaviors).toBeUndefined();
      expect(result.layouts).toBeUndefined();
    });
  });

  describe('translateSchema', () => {
    it('translates fieldset titles and property titles/descriptions', () => {
      const translatedTitle = 'Translated Title';
      const translatedDescription = 'Translated Description';
      const req = {
        i18n: vi.fn((key) => {
          if (key === 'Title') return translatedTitle;
          if (key === 'Description') return translatedDescription;
          return key;
        }),
      } as unknown as Request;
      const schema: Schema = {
        fieldsets: [{ id: 'default', title: 'Title', fields: ['title'] }],
        properties: { title: { title: 'Title', description: 'Description' } },
      };
      const result = translateSchema(schema, req);
      expect(result.fieldsets[0].title).toBe(translatedTitle);
      expect(result.properties!['title'].title).toBe(translatedTitle);
      expect(result.properties!['title'].description).toBe(
        translatedDescription,
      );
    });
  });

  describe('schemaToHtml', () => {
    it('generates HTML with defined data', () => {
      const schema: Schema = {
        fieldsets: [{ id: 'default', title: 'Default', fields: ['title'] }],
        properties: { title: { title: 'Title' } },
      };
      const result = schemaToHtml(schema, { title: 'My Title' });
      expect(result).toContain('<th>Title</th>');
      expect(result).toContain('<td>My Title</td>');
    });

    it('renders empty cell for undefined data', () => {
      const schema: Schema = {
        fieldsets: [{ id: 'default', title: 'Default', fields: ['title'] }],
        properties: { title: { title: 'Title' } },
      };
      const result = schemaToHtml(schema, {});
      expect(result).toContain('<td></td>');
    });

    it('renders fieldset title for non-default fieldset', () => {
      const schema: Schema = {
        fieldsets: [{ id: 'custom', title: 'Custom', fields: ['title'] }],
        properties: { title: { title: 'Title' } },
      };
      const result = schemaToHtml(schema, {});
      expect(result).toContain('<th colspan="2">Custom</th>');
    });
  });
});
