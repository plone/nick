---
nav_order: 3
permalink: /rest-api/expansion
parent: REST API
---

# Expansion

Expansion is a mechanism to embed additional "components"—such as navigation, breadcrumbs, schema, or workflows—within the main content response. This helps the API consumers avoid unnecessary requests.

Say you want to show a document together with the breadcrumbs and a workflow switcher. Instead of doing three individual requests, you can expand the breadcrumbs and the workflow "components" within the document `GET` request.

The following is a list of components that support expansion.

- [actions](/actions)
- [breadcrumbs](/breadcrumbs)
- [catalog](/catalog)
- [contextnavigation](/contextnavigation)
- [navigation](/navigation)
- [navroot](/navroot)
- [related](/related)
- [translations](/translations)
- [types](/types)
- [workflow](/workflow)

You can also get the list expandable components by inspecting the @components attribute in the response of any content GET request, as shown in the following example.

```http
{% include_relative examples/translations/get_expansion.req %}
```

Or use the client directly:

```ts
{% include_relative examples/translations/get_expansion.ts %}
```

Example response:

```http
{% include_relative examples/translations/get_expansion.res %}
```

In order to expand and embed the translations component, use the `GET` parameter expand with the value translations.

```http
{% include_relative examples/translations/get_expansion_expanded.req %}
```

Or use the client directly:

```ts
{% include_relative examples/translations/get_expansion_expanded.ts %}
```

Example response:

```http
{% include_relative examples/translations/get_expansion_expanded.res %}
```
