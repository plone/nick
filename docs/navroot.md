---
nav_order: 19
permalink: /endpoints/navroot
parent: Endpoints
---

# Navigation root

Nick has a concept called navigation root which provides a way to root catalog queries, searches, breadcrumbs, and so on in a given section of the site. This feature is useful when working with subsites or multilingual sites, because it allows the site manager to restrict searches or navigation queries to a specific location in the site.

This navigation root information is different depending on the context of the request. For instance, in a default multilingual site when browsing the contents inside a language folder such as `www.domain.com/en`, the context is `en` and its navigation root will be `/en/`. In a non-multilingual site, the context is the root of the site such as `www.domain.com` and the navigation root will be `/`.

To get the information about the navigation root, the REST API has a `@navroot` contextual endpoint. For instance, send a `GET` request to the `@navroot` endpoint at the root of the site:

```http
{% include_relative examples/navroot/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/navroot/get.ts %}
```

The response will contain the navigation root information for the site:

```http
{% include_relative examples/navroot/get.res %}
```
