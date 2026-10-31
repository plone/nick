---
permalink: /rest-api/endpoints/worklists
parent: Endpoints
---

# Worklists

Workflows can define worklists, like DCWorkflow: for example a desk inbox that lists the content waiting for review to users with the `Review` permission. plone.restapi has no endpoint for worklists; Nick lists the worklists of the current user with a `GET` request to `@worklists` on any context:

```http
GET /@worklists HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
```

```json
{
  "@id": "http://localhost:8080/@worklists",
  "items": [
    {
      "@id": "http://localhost:8080/@worklists/editorial_workflow/desk_inbox",
      "id": "desk_inbox",
      "workflow": "editorial_workflow",
      "title": "Stories for the desk",
      "description": "Stories for the desk",
      "action": {
        "title": "Desk (2)",
        "url": "http://localhost:8080/search?review_state=in_review",
        "category": "global"
      },
      "items": [
        {
          "@id": "http://localhost:8080/news/item-0",
          "@type": "Story",
          "title": "Item 0",
          "review_state": "in_review"
        }
      ],
      "items_total": 2
    }
  ],
  "items_total": 1
}
```

A worklist is listed when the user passes its guard on the site root and at least one item matches. The items are content of the types using the workflow that the user can view and whose `review_state` (and other [workflow variables](/developer-guide/workflows#variables)) match. They are sorted by path and batched with `b_start` and `b_size` (default 25); `items_total` is the number of matches. `%(count)d` and `%(portal_url)s` in the action are replaced like in Plone.
