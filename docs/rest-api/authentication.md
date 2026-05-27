---
nav_order: 1
permalink: /rest-api/authentication
parent: REST API
---

# Authentication

For authentication JSON Web Tokens (JWT) are used.

## JSON Web Tokens (JWT)

### Acquiring a token

A JWT token can be acquired by posting a user's credentials to the `@login` endpoint.

```http
{% include_relative endpoints/examples/authentication/login_post_valid.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/authentication/login_post_valid.ts %}
```

The server responds with a JSON object containing the token.

```http
{% include_relative endpoints/examples/authentication/login_post_valid.res %}
```

If you send incorrect credentials you will get notified.

```http
{% include_relative endpoints/examples/authentication/login_post_incorrect.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/authentication/login_post_incorrect.ts %}
```

```http
{% include_relative endpoints/examples/authentication/login_post_incorrect.res %}
```

If you send credentials for a non-existing user you will also get notified.

```http
{% include_relative endpoints/examples/authentication/login_post_invalid.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/authentication/login_post_invalid.ts %}
```

```http
{% include_relative endpoints/examples/authentication/login_post_invalid.res %}
```

When you don't set all the required fields you will get an error message.

```http
{% include_relative endpoints/examples/authentication/login_post_missing.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/authentication/login_post_missing.ts %}
```

```http
{% include_relative endpoints/examples/authentication/login_post_missing.res %}
```

### Authenticating with a token

The token can now be used in subsequent requests by including it in the Authorization header with the Bearer scheme:

```http
{% include_relative endpoints/examples/authentication/login_renew_post_valid.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/authentication/login_renew_post_valid.ts %}
```

### Renewing a token

By default the token will expire after 12 hours and thus must be renewed before expiration. To renew the token simply post to the `@login-renew` endpoint.

```http
{% include_relative endpoints/examples/authentication/login_renew_post_valid.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/authentication/login_renew_post_valid.ts %}
```

The server returns a JSON object with a new token:

```http
{% include_relative endpoints/examples/authentication/login_renew_post_valid.res %}
```

When you don't provide a session or your session is incorrect:

```http
{% include_relative endpoints/examples/authentication/login_renew_post_invalid.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/authentication/login_renew_post_invalid.ts %}
```

The server responds with an error message:

```http
{% include_relative endpoints/examples/authentication/login_renew_post_invalid.res %}
```

### Invalidating a token

The `@logout` endpoint can be used to invalidate tokens. Tokens are persisted on the server and thus can be invalidated.

The logout request must contain the existing token in the `Authorization` header.

```http
{% include_relative endpoints/examples/authentication/logout_post.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/authentication/logout_post.ts %}
```

If invalidation succeeds, the server responds with an empty 204 reponse:

```http
{% include_relative endpoints/examples/authentication/logout_post.res %}
```

## Permissions

In order for a user to use the REST API you need common permissions depending on the particular service. For example, retrieving a resource using `GET` will require `View`, adding an object using `POST` will require `Add`, and so on.
