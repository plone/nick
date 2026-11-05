/**
 * Somersault block tests.
 * @module blocks/somersault/somersault.test
 */

// External imports
import { describe, it, expect } from 'vitest';

// Internal imports
import '../../app';
import blocks from '..';
import { SOMERSAULT } from './somersault';

const block = {
  '@type': SOMERSAULT,
  value: [
    { type: 'title', children: [{ text: 'Annual report' }] },
    { type: 'p', children: [{ text: 'Our year in numbers.' }] },
    {
      type: 'ploneBlock',
      '@type': 'slate',
      value: [{ type: 'p', children: [{ text: 'Legacy text' }] }],
      plaintext: 'Legacy text',
      children: [{ text: '' }],
    },
    {
      type: 'ploneBlock',
      '@type': 'html',
      html: '<p>Raw <script>alert(1)</script>html</p>',
      children: [{ text: '' }],
    },
    {
      type: 'ploneBlock',
      '@type': 'image',
      url: '/image.jpg',
      children: [{ text: '' }],
    },
  ],
};

describe('Somersault block', () => {
  it('should be registered', () => {
    expect(blocks.blocks[SOMERSAULT]).toBeDefined();
  });

  it('should convert the document to markdown', () => {
    expect(blocks.get(SOMERSAULT).toMarkdown(block, {})).toBe(
      '# Annual report\n\nOur year in numbers.\n\nLegacy text\n\nRaw alert(1)html',
    );
  });

  it('should get the searchable text without the title', () => {
    expect(blocks.get(SOMERSAULT).searchableText(block)).toBe(
      'Our year in numbers. Legacy text',
    );
  });

  it('should replace text', () => {
    const value = blocks.get(SOMERSAULT).replace(block, /year/g, 'decade');
    expect(value[1]).toEqual({
      type: 'p',
      children: [{ text: 'Our decade in numbers.' }],
    });
    expect(blocks.get(SOMERSAULT).replace(block, /nothing/g, 'x')).toBe(false);
  });

  it('should process the wrapped blocks', async () => {
    const processed = await blocks.get(SOMERSAULT).process(block);
    expect(processed.value[3].html).not.toContain('<script>');
    expect(processed.value[4]).toEqual(block.value[4]);
  });

  it('should handle a document without value', async () => {
    const empty = { '@type': SOMERSAULT };
    expect(blocks.get(SOMERSAULT).toMarkdown(empty, {})).toBe('');
    expect(blocks.get(SOMERSAULT).searchableText(empty)).toBe('');
    expect(blocks.get(SOMERSAULT).replace(empty, /x/g, 'y')).toBe(false);
    expect(await blocks.get(SOMERSAULT).process(empty)).toEqual(empty);
  });
});
