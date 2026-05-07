---
nav_order: 34
permalink: /endpoints/vocabularies
parent: Endpoints
---

# Vocabularies

Vocabularies are a set of allowed choices that back a particular field. They contain so called _terms_ which represent those allowed choices.

## Concepts

**Vocabularies** contain a list of terms. These terms are usually tokenized, meaning that in addition to a term's value, it also has a `token` which is a machine-friendly identifier for the term.

Terms can also have a title, which is intended to be the user-facing label for the term.

Vocabularies can be context-sensitive, meaning that they take the context into account and their contents may therefore change depending on the context they're invoked on.

## Listing all vocabularies

To retrieve a list of all the available vocabularies, send a `GET` request to the `@vocabularies` endpoint:

```http
{% include_relative examples/vocabularies/list.req %}
```

Or use the client directly:

```ts
{% include_relative examples/vocabularies/list.ts %}
```

The response will include a list with the URL (`@id`) and the names (`title`) of all the available vocabularies:

```http
{% include_relative examples/vocabularies/list.res %}
```

## Get a vocabulary

To enumerate the terms of a particular vocabulary, use the `@vocabularies` endpoint with the name of the vocabulary, e.g. `/@vocabularies/roles`. The endpoint can be used with the site root and content objects.

```http
{% include_relative examples/vocabularies/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/vocabularies/get.ts %}
```

The server will respond with a list of terms. The title is purely for display purposes. The token is what should be sent to the server to address that term.

```http
{% include_relative examples/vocabularies/get.res %}
```
