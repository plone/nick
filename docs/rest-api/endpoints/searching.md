---
permalink: /endpoints/searching
parent: Endpoints
---

# Search

## Searching content

Content can be searched for by invoking the `/@search` endpoint on any context:

```http
{% include_relative examples/search/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get.res %}
```

## Searching text

When you specify the `SearchableText` parameter you can search for specific content:

```http
{% include_relative examples/search/get_news.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get_news.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get_news.res %}
```

## Sorting on title

You can also sort the search results on title:

```http
{% include_relative examples/search/get_sort_title.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get_sort_title.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get_sort_title.res %}
```

## Sorting on date

You can also sort the search results on date:

```http
{% include_relative examples/search/get_sort_date.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get_sort_date.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get_sort_date.res %}
```

## Sorting on unknown

When you sort on an unknown column it will be ignored:

```http
{% include_relative examples/search/get_sort_unknown.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get_sort_unknown.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get_sort_unknown.res %}
```

## Sorting reverse

You can also sort the search results reverse:

```http
{% include_relative examples/search/get_sort_reverse.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get_sort_reverse.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get_sort_reverse.res %}
```

## Sorting depth

You can specify the depth used to search:

```http
{% include_relative examples/search/get_depth.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get_depth.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get_depth.res %}
```

## Sorting using batching

You can specify the batch size when searching:

```http
{% include_relative examples/search/get_batch.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get_batch.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get_batch.res %}
```

## Sorting using batch offset

You can specify the batch offset of the search:

```http
{% include_relative examples/search/get_offset.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get_offset.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get_offset.res %}
```

## Sorting on unknown

It will ignore unknown parameters:

```http
{% include_relative examples/search/get_unknown.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/get_unknown.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/get_unknown.res %}
```

## Sorting querystring search

You can also search using a `POST` call and specify a querystring:

```http
{% include_relative examples/search/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/search/post.ts %}
```

This will return all content object:

```http
{% include_relative examples/search/post.res %}
```

## Searching using an embedding model

When AI is enabled in the config you can search based on `embeddings`. When you provide a `SearchableText` parameter it will be converted to an `embedding` and compared with all other embeddings in the site. You can set the similarity cut off in the config by specifying `minSimilarity` in the embed model settings. Results are automatically ordered by similarity but can be ordered differently when specified.

```http
{% include_relative examples/search/get_embed.req %}

```

Or use the client directly:

```ts
{% include_relative examples/search/get_embed.ts %}
```

Example response:

```http
{% include_relative examples/search/get_embed.res %}
```
