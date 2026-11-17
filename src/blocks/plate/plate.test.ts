/**
 * Plate block tests.
 * @module blocks/plate/plate.test
 */

// External imports
import { describe, it, expect } from 'vitest';

// Internal imports
import '../../app';
import blocks from '..';
import { getMainRegion, getPlateRegions, LEGACY_PLATE, PLATE } from './plate';

const block = {
  '@type': PLATE,
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

describe('Plate block', () => {
  it('should be registered for the current and the legacy type', () => {
    expect(blocks.blocks[PLATE]).toBeDefined();
    expect(blocks.blocks[LEGACY_PLATE]).toBe(blocks.blocks[PLATE]);
  });

  it('should convert the document to markdown', () => {
    expect(blocks.get(PLATE).toMarkdown(block, {})).toBe(
      '# Annual report\n\nOur year in numbers.\n\nLegacy text\n\nRaw alert(1)html',
    );
  });

  it('should get the searchable text without the title', () => {
    expect(blocks.get(PLATE).searchableText(block)).toBe(
      'Our year in numbers. Legacy text',
    );
  });

  it('should replace text', () => {
    const value = blocks.get(PLATE).replace(block, /year/g, 'decade');
    expect(value[1]).toEqual({
      type: 'p',
      children: [{ text: 'Our decade in numbers.' }],
    });
    expect(blocks.get(PLATE).replace(block, /nothing/g, 'x')).toBe(false);
  });

  it('should process the wrapped blocks', async () => {
    const processed = await blocks.get(PLATE).process(block);
    expect(processed.value[3].html).not.toContain('<script>');
    expect(processed.value[4]).toEqual(block.value[4]);
  });

  it('should handle a document without value', async () => {
    const empty = { '@type': PLATE };
    expect(blocks.get(PLATE).toMarkdown(empty, {})).toBe('');
    expect(blocks.get(PLATE).searchableText(empty)).toBe('');
    expect(blocks.get(PLATE).replace(empty, /x/g, 'y')).toBe(false);
    expect(await blocks.get(PLATE).process(empty)).toEqual(empty);
  });

  it('should read a legacy region like a current one', () => {
    const legacy = { ...block, '@type': LEGACY_PLATE };
    expect(blocks.get(LEGACY_PLATE).toMarkdown(legacy, {})).toBe(
      blocks.get(PLATE).toMarkdown(block, {}),
    );
  });
});

describe('Plate regions', () => {
  const main = { '@type': PLATE, value: [] };
  const aboveContent = { '@type': PLATE, value: [] };
  const legacy = { '@type': LEGACY_PLATE, value: [] };
  const slate = { '@type': 'slate', value: [] };

  it('should get the main region', () => {
    expect(getMainRegion({ main, aboveContent })).toBe(main);
    expect(getMainRegion({ __somersault__: legacy })).toBe(legacy);
    expect(getMainRegion({ main, __somersault__: legacy })).toBe(main);
    expect(getMainRegion({ aboveContent, slate })).toBeUndefined();
    expect(getMainRegion({ main: slate })).toBeUndefined();
    expect(getMainRegion(undefined)).toBeUndefined();
  });

  it('should find the regions by type, the main region first', () => {
    expect(getPlateRegions({ aboveContent, slate, main })).toEqual([
      main,
      aboveContent,
    ]);
    expect(getPlateRegions({ aboveContent, slate, main })[1]).toBe(
      aboveContent,
    );
    expect(getPlateRegions({ __somersault__: legacy, slate })).toEqual([
      legacy,
    ]);
    expect(getPlateRegions(null)).toEqual([]);
  });
});
