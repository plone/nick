---
permalink: /endpoints/scheduled-jobs
parent: Endpoints
---

# Scheduled Jobs

Scheduled jobs are recurring tasks that run on a cron schedule. You can create, read, update, and delete them, as well as list available job actions.

| Verb     | URL                       | Action                       |
| -------- | ------------------------- | ---------------------------- |
| `GET`    | `/@scheduled-jobs`        | List all scheduled jobs      |
| `GET`    | `/@scheduled-jobs/{id}`   | Get a specific scheduled job |
| `POST`   | `/@scheduled-jobs`        | Create a new scheduled job   |
| `PATCH`  | `/@scheduled-jobs/{id}`   | Update a scheduled job       |
| `DELETE` | `/@scheduled-jobs/{id}`   | Delete a scheduled job       |
| `GET`    | `/@scheduled-job-actions` | List available job actions   |

## Scheduled job schema

A scheduled job object has the following properties:

| Property      | Type   | Description                           |
| ------------- | ------ | ------------------------------------- |
| `@id`         | string | Unique IRI for the scheduled job      |
| `id`          | string | ID of the scheduled job               |
| `title`       | string | Human-readable title                  |
| `description` | string | Human-readable description            |
| `action`      | string | The action to execute                 |
| `params`      | object | Parameters passed to the job action   |
| `schedule`    | string | Cron expression defining the schedule |

## List all scheduled jobs

To retrieve all scheduled jobs, send a `GET` request to the `/@scheduled-jobs` endpoint:

```http
{% include_relative examples/scheduled_jobs/get_all.req %}
```

Or use the client directly:

```ts
{% include_relative examples/scheduled_jobs/get_all.ts %}
```

Response:

```http
{% include_relative examples/scheduled_jobs/get_all.res %}
```

## Get a specific scheduled job

To retrieve a single scheduled job by its ID, send a `GET` request to the `/@scheduled-jobs/{id}` endpoint:

```http
{% include_relative examples/scheduled_jobs/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/scheduled_jobs/get.ts %}
```

Response:

```http
{% include_relative examples/scheduled_jobs/get.res %}
```

## Create a scheduled job

To create a new scheduled job, send a `POST` request to the `/@scheduled-jobs` endpoint with a JSON payload:

```http
{% include_relative examples/scheduled_jobs/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/scheduled_jobs/post.ts %}
```

Response:

```http
{% include_relative examples/scheduled_jobs/post.res %}
```

## Update a scheduled job

To update an existing scheduled job, send a `PATCH` request to the `/@scheduled-jobs/{id}` endpoint with a JSON payload:

```http
{% include_relative examples/scheduled_jobs/patch.req %}
```

Or use the client directly:

```ts
{% include_relative examples/scheduled_jobs/patch.ts %}
```

Response:

```http
{% include_relative examples/scheduled_jobs/patch.res %}
```

## Delete a scheduled job

To delete a scheduled job, send a `DELETE` request to the `/@scheduled-jobs/{id}` endpoint:

```http
{% include_relative examples/scheduled_jobs/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/scheduled_jobs/delete.ts %}
```

Response:

```http
{% include_relative examples/scheduled_jobs/delete.res %}
```

## List available job actions

To retrieve all available scheduled job actions, send a `GET` request to the `/@scheduled-job-actions` endpoint:

```http
{% include_relative examples/scheduled_jobs/get_actions.req %}
```

Or use the client directly:

```ts
{% include_relative examples/scheduled_jobs/get_actions.ts %}
```

Response:

```http
{% include_relative examples/scheduled_jobs/get_actions.res %}
```
