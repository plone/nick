---
permalink: /endpoints/userschema
parent: Endpoints
---

# User schema

Users in Nick have a set of properties defined by a default set of fields such as `fullname`, `email`, and so on. These properties define the site user's profile and the user itself via the UI.

## Get the schema for the user profile

To get the current schema for the user profile, make a request to the `/@userschema` endpoint.

```http
{% include_relative examples/userschema/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/userschema/get.ts %}
```

The server will respond with the user profile schema.

```http
{% include_relative examples/userschema/get.res %}
```

The user schema uses the same serialization as the type's JSON schema.

## Get the registration form

In Nick you can configure each of the fields of the user schema to be available in only one of either the user profile form or registration form, or in both of them.

To get the user schema available for the user registration form, make a request to the `@userschema/registration` endpoint.

```http
{% include_relative examples/userschema/registration.req %}
```

Or use the client directly:

```ts
{% include_relative examples/userschema/registration.ts %}
```

The server will respond with the user schema for registration.

```http
{% include_relative examples/userschema/registration.res %}
```

The user schema uses the same serialization as the type's JSON schema.
