---
nav_order: 28
permalink: /endpoints/translations
parent: Endpoints
---

# Translations

Multilingual is included in Nick. It is not enabled by default.

You can enable the multilingual support by adding the `multilingual` profile to your configuration file. You can also replace the `default` profile with the `multilingualcontent` profile if you want to your initial content to be multilingual.

Nick provides a `@translations` endpoint to handle the translation information of the content objects.

Once we enabled more than one language, we can link two content items of different languages to be the translation of each other issuing a `POST` query to the `@translations` endpoint, including the `id` of the content to which it should be linked. The `id` of the content must be a full URL of the content object:

```http
{% include_relative examples/translations/post_url.req %}
```

Or use the client directly:

```ts
{% include_relative examples/translations/post_url.ts %}
```

The API will return a 201 Created response, if the linking was successful:

```http
{% include_relative examples/translations/post_url.res %}
```

We can also use the object's path to link the translation instead of the full URL:

```http
{% include_relative examples/translations/post_path.req %}
```

Or use the client directly:

```ts
{% include_relative examples/translations/post_path.ts %}
```

```http
{% include_relative examples/translations/post_path.res %}
```

We can also use the object's UID to link the translation:

```http
{% include_relative examples/translations/post_uuid.req %}
```

Or use the client directly:

```ts
{% include_relative examples/translations/post_uuid.ts %}
```

```http
{% include_relative examples/translations/post_uuid.res %}
```

After linking the contents, we can get the list of the translations of that content item by issuing a `GET` request on the `@translations` endpoint of that content item:

```http
{% include_relative examples/translations/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/translations/get.ts %}
```

```http
{% include_relative examples/translations/get.res %}
```

To unlink the content, issue a `DELETE` request on the `@translations` endpoint of the content item, and provide the language code you want to unlink:

```http
{% include_relative examples/translations/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/translations/delete.ts %}
```

```http
{% include_relative examples/translations/delete.res %}
```

## Creating a translation from an existing content

The `POST` content endpoint to a folder is also capable of linking this new content with an existing translation using two parameters: `translationOf` and `language`.

```http
{% include_relative examples/translations/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/translations/post.ts %}
```

```http
{% include_relative examples/translations/post.res %}
```

## Get location in the tree for new translations

When you create a translation in Plone, there are policies in place for finding a suitable placement for it. This endpoint returns the proper placement for the newly created translation:

```http
{% include_relative examples/translations/get_locator.req %}
```

Or use the client directly:

```ts
{% include_relative examples/translations/get_locator.ts %}
```

```http
{% include_relative examples/translations/get_locator.res %}
```
