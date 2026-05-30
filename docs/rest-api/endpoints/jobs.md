---
permalink: /endpoints/jobs
parent: Endpoints
---

# Jobs

Nick provides a jobs system to manage long-running tasks asynchronously. Jobs can be [created](/developer-guide/jobs), listed, inspected, deleted, aborted, and retried.

| Verb     | URL                 | Action              |
| -------- | ------------------- | ------------------- |
| `GET`    | `/@jobs`            | List all jobs       |
| `GET`    | `/@jobs/{id}`       | Get a specific job  |
| `DELETE` | `/@jobs/{id}`       | Delete a job        |
| `POST`   | `/@jobs/{id}/abort` | Abort a running job |
| `POST`   | `/@jobs/{id}/retry` | Retry a failed job  |

## Job schema

A job object has the following properties:

| Property      | Type             | Description                                                       |
| ------------- | ---------------- | ----------------------------------------------------------------- |
| `uuid`        | string           | UUID of the job                                                   |
| `title`       | string           | Human-readable title                                              |
| `description` | string           | Human-readable description                                        |
| `params`      | object           | Parameters passed to the job                                      |
| `actor`       | string           | User who created the job                                          |
| `created`     | datetime         | Timestamp when the job was created                                |
| `started`     | datetime or null | Timestamp when the job started                                    |
| `finished`    | datetime or null | Timestamp when the job finished                                   |
| `status`      | string           | Status: `created`, `running`, `completed`, `failed`, or `aborted` |
| `result`      | object           | Result data produced by the job                                   |

## List all jobs

To retrieve all jobs, send a `GET` request to the `/@jobs` endpoint:

```http
{% include_relative examples/jobs/get_all.req %}
```

Or use the client directly:

```ts
{% include_relative examples/jobs/get_all.ts %}
```

Response:

```http
{% include_relative examples/jobs/get_all.res %}
```

## Get a specific job

To retrieve a single job by its UUID, send a `GET` request to the `/@jobs/{id}` endpoint:

```http
{% include_relative examples/jobs/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/jobs/get.ts %}
```

Response:

```http
{% include_relative examples/jobs/get.res %}
```

## Delete a job

To delete a job, send a `DELETE` request to the `/@jobs/{id}` endpoint:

```http
{% include_relative examples/jobs/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/jobs/delete.ts %}
```

Response:

```http
{% include_relative examples/jobs/delete.res %}
```

## Abort a job

To abort a running job, send a `POST` request to the `/@jobs/{id}/abort` endpoint:

```http
{% include_relative examples/jobs/post_abort.req %}
```

Or use the client directly:

```ts
{% include_relative examples/jobs/post_abort.ts %}
```

Response:

```http
{% include_relative examples/jobs/post_abort.res %}
```

## Retry a job

To retry a failed job, send a `POST` request to the `/@jobs/{id}/retry` endpoint:

```http
{% include_relative examples/jobs/post_retry.req %}
```

Or use the client directly:

```ts
{% include_relative examples/jobs/post_retry.ts %}
```

Response:

```http
{% include_relative examples/jobs/post_retry.res %}
```
