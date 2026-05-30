---
permalink: /rest-api/endpoints/email
parent: Endpoints
---

# Email

## Send Mail to Arbitrary Addresses

To send an email to an arbitrary e-mail address, send a POST request to the `@email-send`endpoint that is available on the site root:

```http
{% include_relative examples/mail/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/mail/post.ts %}
```

The `to`, `from` and `message` fields are required. The `subject` and `name` fields are optional.

The server will respond with status 204 No Content when the email has been sent successfully:

```http
{% include_relative examples/mail/post.res %}
```

## Contact Site Owner aka Contact Form

Nick allows the user to contact the site owner via a form on the website. This makes sure the site owner does not have to expose their email addresses publicly and at the same time allow the users to reach out to the site owners.

To send an email notification to the site owner, send a `POST` request to the `/@email-notification` endpoint that is available on the site root:

```http
{% include_relative examples/mail/post_webmaster.req %}
```

Or use the client directly:

```ts
{% include_relative examples/mail/post_webmaster.ts %}
```

The _from_ and _message_ fields are required. The _subject_ and _name_ fields are optional.

The server will respond with status `204 No Content` when the email has been sent successfully:

```http
{% include_relative examples/mail/post_webmaster.res %}
```

## Contact Users

To send an email notification to another user of the portal, send a `POST` request to the `/@email-notification` endpoint on a particular user (e.g. the admin user):

```http
{% include_relative examples/mail/post_user.req %}
```

Or use the client directly:

```ts
{% include_relative examples/mail/post_user.ts %}
```

The server will respond with status `204 No Content` when the email has been sent successfully:

```http
{% include_relative examples/mail/post_user.res %}
```
