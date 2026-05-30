---
permalink: /rest-api/endpoints/form
parent: Endpoints
---

# Form

Nick has form support which can be used with the `@plone/volto-form-block` package.

## Submit

To submit a form use the following request. The block `id` and the `data` of the form should be provided in the endpoint.

```http
{% include_relative examples/form/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/form/post.ts %}
```

The API will return a 200 response:

```http
{% include_relative examples/form/post.res %}
```

## Form Data

If the form has `store` data enabled you can fetch the submitted values of the form.

```http
{% include_relative examples/form/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/form/get.ts %}
```

The API will return a 200 response:

```http
{% include_relative examples/form/get.res %}
```
