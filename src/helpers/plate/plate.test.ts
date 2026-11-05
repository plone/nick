/**
 * Plate helper tests.
 * @module helpers/plate/plate.test
 */

// External imports
import { describe, it, expect } from 'vitest';

// Internal imports
import {
  mapPlateBlocks,
  plateBlocks,
  plateToMarkdown,
  plateToText,
} from './plate';

const image = {
  type: 'ploneBlock',
  '@type': 'image',
  url: '/image.jpg',
  children: [{ text: '' }],
};

describe('plateToMarkdown', () => {
  it('should convert the title, paragraphs and headings', () => {
    expect(
      plateToMarkdown([
        { type: 'title', children: [{ text: 'Annual report' }] },
        { type: 'p', children: [{ text: 'Our year in numbers.' }] },
        { type: 'h2', children: [{ text: 'Results' }] },
      ]),
    ).toBe('# Annual report\n\nOur year in numbers.\n\n## Results\n\n');
  });

  it('should convert marks and links', () => {
    expect(
      plateToMarkdown([
        {
          type: 'p',
          children: [
            { text: 'bold', bold: true },
            { text: ' and ' },
            { text: 'italic', italic: true },
            { text: ' and ' },
            { text: 'code', code: true },
            { text: ' and ' },
            { text: 'gone', strikethrough: true },
            { text: ', see ' },
            { type: 'a', url: '/about', children: [{ text: 'About us' }] },
          ],
        },
      ]),
    ).toBe(
      '**bold** and *italic* and `code` and ~~gone~~, see [About us](/about)\n\n',
    );
  });

  it('should convert lists made of paragraphs', () => {
    expect(
      plateToMarkdown([
        { type: 'p', children: [{ text: 'Before' }] },
        {
          type: 'p',
          listStyleType: 'decimal',
          indent: 1,
          children: [{ text: 'One' }],
        },
        {
          type: 'p',
          listStyleType: 'disc',
          indent: 2,
          children: [{ text: 'Nested' }],
        },
        {
          type: 'p',
          listStyleType: 'decimal',
          indent: 1,
          children: [{ text: 'Two' }],
        },
        {
          type: 'p',
          listStyleType: 'todo',
          indent: 1,
          checked: true,
          children: [{ text: 'Done' }],
        },
        { type: 'p', children: [{ text: 'After' }] },
      ]),
    ).toBe('Before\n\n1. One\n    - Nested\n2. Two\n- [x] Done\n\nAfter\n\n');
  });

  it('should convert code blocks, quotes, rules and tables', () => {
    expect(
      plateToMarkdown([
        {
          type: 'code_block',
          lang: 'js',
          children: [
            { type: 'code_line', children: [{ text: 'const a = 1;' }] },
            { type: 'code_line', children: [{ text: 'a++;' }] },
          ],
        },
        { type: 'blockquote', children: [{ text: 'Quote' }] },
        { type: 'hr', children: [{ text: '' }] },
        {
          type: 'table',
          children: [
            {
              type: 'tr',
              children: [
                {
                  type: 'th',
                  children: [{ type: 'p', children: [{ text: 'A' }] }],
                },
                {
                  type: 'th',
                  children: [{ type: 'p', children: [{ text: 'B' }] }],
                },
              ],
            },
            {
              type: 'tr',
              children: [
                {
                  type: 'td',
                  children: [{ type: 'p', children: [{ text: '1' }] }],
                },
                {
                  type: 'td',
                  children: [{ type: 'p', children: [{ text: '2' }] }],
                },
              ],
            },
          ],
        },
      ]),
    ).toBe(
      '```js\nconst a = 1;\na++;\n```\n\n> Quote\n\n---\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n',
    );
  });

  it('should render wrapped blocks with the callback', () => {
    expect(
      plateToMarkdown(
        [
          image,
          {
            type: 'column_group',
            children: [
              {
                type: 'column',
                children: [{ type: 'p', children: [{ text: 'Left' }] }],
              },
            ],
          },
        ],
        (node) => `![](${node.url})\n\n`,
      ),
    ).toBe('![](/image.jpg)\n\nLeft\n\n');
  });

  it('should ignore invalid values', () => {
    expect(plateToMarkdown(undefined as any)).toBe('');
    expect(plateToMarkdown([null as any, { type: 'p' }])).toBe('\n\n');
    expect(plateToMarkdown([image])).toBe('');
  });
});

describe('plateToText', () => {
  it('should join the text of the elements with a space', () => {
    expect(
      plateToText(
        [
          { type: 'title', children: [{ text: 'Title' }] },
          {
            type: 'p',
            children: [
              { text: 'Hello ' },
              { text: 'world', bold: true },
              { type: 'a', url: '/', children: [{ text: '!' }] },
            ],
          },
          { type: 'p', children: [{ text: '' }] },
          image,
          {
            type: 'table',
            children: [
              {
                type: 'tr',
                children: [
                  {
                    type: 'td',
                    children: [{ type: 'p', children: [{ text: 'A' }] }],
                  },
                  {
                    type: 'td',
                    children: [{ type: 'p', children: [{ text: 'B' }] }],
                  },
                ],
              },
            ],
          },
        ],
        (node) => node.url,
        ['title'],
      ),
    ).toBe('Hello world! /image.jpg A B');
  });

  it('should ignore invalid values', () => {
    expect(plateToText(undefined as any)).toBe('');
    expect(plateToText([image])).toBe('');
  });
});

describe('plateBlocks', () => {
  it('should find the wrapped blocks, also nested ones', () => {
    const teaser = { ...image, '@type': 'teaser' };
    expect(
      plateBlocks([
        image,
        { type: 'p', children: [{ text: '' }] },
        {
          type: 'column_group',
          children: [{ type: 'column', children: [teaser] }],
        },
      ]),
    ).toEqual([image, teaser]);
    expect(plateBlocks(undefined as any)).toEqual([]);
  });
});

describe('mapPlateBlocks', () => {
  it('should replace the wrapped blocks, also nested ones', async () => {
    expect(
      await mapPlateBlocks(
        [
          image,
          { type: 'p', children: [{ text: 'Text' }] },
          { type: 'column', children: [image] },
        ],
        async (node) => ({ ...node, url: '/other.jpg' }),
      ),
    ).toEqual([
      { ...image, url: '/other.jpg' },
      { type: 'p', children: [{ text: 'Text' }] },
      { type: 'column', children: [{ ...image, url: '/other.jpg' }] },
    ]);
  });
});
