/**
 * Markdown helper tests.
 * @module helpers/markdown/markdown.test
 */

// External imports
import { describe, it, expect } from 'vitest';

// Internal imports
import { slateToMarkdown, slateReplace } from './slate';

describe('slateToMarkdown', () => {
  it('should convert a simple paragraph to Markdown', () => {
    expect(
      slateToMarkdown([{ type: 'p', children: [{ text: 'Paragraph' }] }]),
    ).toBe('Paragraph\n\n');
  });

  it('should convert a heading to Markdown', () => {
    expect(
      slateToMarkdown([{ type: 'h2', children: [{ text: 'Heading' }] }]),
    ).toBe('## Heading\n\n');
  });

  it('should convert a paragraph with a link', () => {
    expect(
      slateToMarkdown([
        {
          type: 'p',
          children: [
            {
              text: 'This is the demo site of ',
            },
            {
              data: {
                url: 'https://nickcms.org',
              },
              type: 'link',
              children: [
                {
                  text: 'Nick',
                },
              ],
            },
            {
              text: '.',
            },
          ],
        },
      ]),
    ).toBe('This is the demo site of [Nick](https://nickcms.org).\n\n');
  });

  it('should convert inline styles to Markdown', () => {
    expect(
      slateToMarkdown([
        {
          type: 'p',
          children: [
            {
              text: 'Some text ',
            },
            {
              type: 'strong',
              children: [
                {
                  text: 'with bold text ',
                },
                {
                  type: 'em',
                  children: [
                    {
                      text: 'and nested italic text',
                    },
                  ],
                },
                {
                  text: ' some more bold text',
                },
              ],
            },
            {
              text: '. Some extra ',
            },
            {
              type: 'em',
              children: [
                {
                  text: 'italic text',
                },
              ],
            },
            {
              text: '.',
            },
          ],
        },
      ]),
    ).toBe(
      'Some text **with bold text *and nested italic text* some more bold text**. Some extra *italic text*.\n\n',
    );
  });

  it('should convert a unordered list to Markdown', () => {
    expect(
      slateToMarkdown([
        {
          type: 'ul',
          children: [
            {
              type: 'li',
              children: [
                {
                  text: 'Item 1',
                },
              ],
            },
            {
              type: 'li',
              children: [
                {
                  text: 'Item 2',
                },
              ],
            },
          ],
        },
      ]),
    ).toBe('- Item 1\n- Item 2\n\n');
  });

  it('should convert a nested ordered list to Markdown', () => {
    expect(
      slateToMarkdown([
        {
          type: 'ol',
          children: [
            {
              type: 'li',
              children: [
                {
                  text: 'Item 1',
                },
              ],
            },
            {
              type: 'li',
              children: [
                {
                  text: 'Item 2',
                },
              ],
            },
            {
              type: 'ol',
              children: [
                {
                  type: 'li',
                  children: [
                    {
                      text: 'Item 2.1',
                    },
                  ],
                },
                {
                  type: 'ol',
                  children: [
                    {
                      type: 'li',
                      children: [
                        {
                          text: 'Item 2.1.1',
                        },
                      ],
                    },
                    {
                      type: 'li',
                      children: [
                        {
                          text: 'Item 2.1.2',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'li',
                  children: [
                    {
                      text: 'Item 2.2',
                    },
                  ],
                },
              ],
            },
            {
              type: 'li',
              children: [
                {
                  text: 'Item 3',
                },
              ],
            },
          ],
        },
      ]),
    ).toBe(
      '1. Item 1\n2. Item 2\n    1. Item 2.1\n        1. Item 2.1.1\n        2. Item 2.1.2\n    2. Item 2.2\n3. Item 3\n\n',
    );
  });
});

describe('slateReplace', () => {
  it('should replace text in a simple text node', () => {
    const nodes = [{ text: 'Hello World' }];
    const pattern = new RegExp('World', 'g');
    const result = slateReplace(nodes, pattern, 'Nick');
    expect(result).toEqual([{ text: 'Hello Nick' }]);
  });

  it('should replace text in nested nodes', () => {
    const nodes = [
      {
        type: 'p',
        children: [
          { text: 'Hello ' },
          { type: 'strong', children: [{ text: 'World' }] },
          { text: '!' },
        ],
      },
    ];
    const pattern = new RegExp('World', 'g');
    const result = slateReplace(nodes, pattern, 'Nick');
    expect(result).toEqual([
      {
        type: 'p',
        children: [
          { text: 'Hello ' },
          { type: 'strong', children: [{ text: 'Nick' }] },
          { text: '!' },
        ],
      },
    ]);
  });

  it('should replace using a RegExp pattern', () => {
    const nodes = [{ text: 'foo bar baz' }];
    const pattern = new RegExp('foo|baz', 'g');
    const result = slateReplace(nodes, pattern, 'qux');
    expect(result).toEqual([{ text: 'qux bar qux' }]);
  });

  it('should replace all occurrences using a global RegExp pattern', () => {
    const nodes = [{ text: 'one one one' }];
    const pattern = new RegExp('one', 'g');
    const result = slateReplace(nodes, pattern, 'two');
    expect(result).toEqual([{ text: 'two two two' }]);
  });
});
