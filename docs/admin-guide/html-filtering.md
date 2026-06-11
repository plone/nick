---
title: HTML Filtering
nav_order: 6
permalink: /admin-guide/html-filtering
parent: Admin guide
---

# HTML Filtering

Nick applies server-side HTML filtering to prevent cross-site scripting (XSS) attacks. When content is submitted, the HTML block type is sanitized before storage, removing or escaping dangerous tags and attributes.

## How It Works

Filtering runs on every `POST` and `PATCH` request that contains HTML block data.

The `xss` library processes the raw HTML against a whitelist of allowed tags and attributes. Anything not in the whitelist is either escaped or stripped depending on the configuration.

---

## Default Configuration

Out of the box, Nick applies this setting:

```typescript
export const config = {
  xss: { stripIgnoreTagBody: ['script'] },
};
```

This strips `<script>` tags and all their content. All other tags are handled by the `xss` library's built-in whitelist, which allows common safe HTML tags like `<a>`, `<b>`, `<i>`, `<p>`, `<img>`, `<div>`, `<span>`, `<table>`, and others, while escaping or removing dangerous attributes like `onclick`, `onerror`, `javascript:`, etc.

## Configuration Reference

The `xss` setting accepts any option from the `IFilterXSSOptions` interface. The most commonly used options are:

| Option                       | Type                  | Description                                             |
| ---------------------------- | --------------------- | ------------------------------------------------------- |
| `allowList`                  | `IWhiteList`          | Allowed HTML tags and their permitted attributes        |
| `stripIgnoreTag`             | `boolean`             | Strip disallowed tags entirely instead of escaping them |
| `stripIgnoreTagBody`         | `boolean \| string[]` | Strip disallowed tags and their content (specific tags) |
| `allowCommentTag`            | `boolean`             | Allow HTML comments (`<!-- -->`)                        |
| `css`                        | `{} \| boolean`       | CSS filtering options, or `false` to disable            |
| `stripBlankChar`             | `boolean`             | Strip blank characters from output                      |
| `singleQuotedAttributeValue` | `boolean`             | Use single quotes for attribute values                  |

## Custom Allowed Tags and Attributes

You can override the whitelist to control exactly which HTML tags and attributes are permitted:

```typescript
export const config = {
  xss: {
    allowList: {
      a: ['href', 'title', 'target'],
      img: ['src', 'alt', 'width', 'height'],
      p: [],
      br: [],
      strong: [],
      em: [],
      ul: [],
      ol: [],
      li: [],
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
    },
    stripIgnoreTag: true,
  },
};
```

This configuration:

- Allows only the listed tags — all others are stripped
- Restricts attributes on those tags to only what is specified
- Prevents `onclick`, `style`, `class`, `id`, and other potentially dangerous or unwanted attributes

## Stripping Script Tags and Inline Event Handlers

The default config strips `<script>` tags with their body content. To also strip inline event handlers:

```typescript
export const config = {
  xss: {
    stripIgnoreTagBody: ['script'],
    allowList: {
      ...require('xss').whiteList,
      a: ['href', 'title'],
      img: ['src', 'alt'],
    },
  },
};
```

The `xss` library handles event attributes (`on*`) automatically when using the default whitelist — they are not included in the allowed attributes list and are therefore filtered out.

## Disabling CSS Filtering

By default, the `xss` library also filters inline CSS to prevent attacks like `expression()`, `url()`, or `-moz-binding`. You can disable this if you trust your content authors:

```typescript
export const config = {
  xss: {
    css: false,
  },
};
```

## Complete Example (Strict)

```typescript
export const config = {
  xss: {
    allowList: {
      a: ['href'],
      p: [],
      br: [],
      strong: [],
      em: [],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
    allowCommentTag: false,
  },
};
```

This allows only basic text formatting — links, paragraphs, line breaks, bold, and italic. Everything else is stripped.

## Notes

- Filtering only applies to the **HTML block** (`@type: "html"`). Other block types (slate, title, etc.) are not HTML-sanitized.
- The `xss` configuration is read at startup and can be environment-specific (e.g., stricter in production).
- For defense in depth, Nick also sets security headers via Helmet, including `X-XSS-Protection` and `Content-Security-Policy`. Those are configured separately in the application code.
