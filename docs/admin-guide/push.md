---
title: Push API
nav_order: 5
permalink: /admin-guide/push
parent: Push API
---

# Push API

When you want to synchronize content of you website with an external source you can use the Push API. The Push API provides a webhook which will be called whenever content changes in your website.

## Config

To enable the Push API you can add the following to the config file:

```ts
export const config = {
  ...
  push: {
    enabled: true,
    user: 'admin',
    password: 'admin',
    url: 'https://somehost/push',
  },
  ...
};
```

The `user` and `password` are optional but will be used to call the `url` with basic auth.

## Events

The `url` will be called when an event on a content object happens. The following events are used: `add`, `update`, `delete`, `copy`, `move`.

### Add

An example of the `add` event, the catalog is expanded by default:

```json
{
  "method": "add",
  "path": "/events/event-3",
  "data": {
    "start": "2026-04-01T07:00:00.334Z",
    "title": "Event 3",
    "blocks": {
      "5cea07ab-983b-4c86-aba1-6de06e0647c5": { "@type": "title" },
      "6632cf31-4816-4403-a34e-d9d91a60037d": { "@type": "slate" }
    },
    "open_end": false,
    "attendies": [],
    "whole_day": false,
    "relatedItems": [],
    "blocks_layout": {
      "items": [
        "5cea07ab-983b-4c86-aba1-6de06e0647c5",
        "6632cf31-4816-4403-a34e-d9d91a60037d"
      ]
    },
    "@components": {
      "catalog": {
        "@id": "http://localhost:3000/events/event-3/@catalog",
        "@type": "Event",
        "title": "Event 3",
        "getId": "event-3",
        "Creator": "admin",
        "UID": "844890e6-6d78-49cf-bf5c-c66653b50182",
        "path": "/events/event-3",
        "Description": null,
        "Title": "Event 3",
        "Subject": null,
        "is_folderish": true,
        "exclude_from_nav": false,
        "Type": "Event",
        "id": "event-3",
        "portal_type": "Event",
        "review_state": "private",
        "modified": "2026-04-23T16:23:26.000Z",
        "Date": "2026-04-23T16:23:26.000Z",
        "expires": null,
        "created": "2026-04-23T16:23:26.000Z",
        "effective": null,
        "getObjSize": 353,
        "listCreators": ["admin"],
        "mime_type": null,
        "CreationDate": "2026-04-23T16:23:26.000Z",
        "EffectiveDate": null,
        "ExpirationDate": null,
        "ModificationDate": "2026-04-23T16:23:26.000Z",
        "image_field": "",
        "image_scales": {},
        "start": "2026-01-01T08:00:00.105Z",
        "end": null,
        "recurrence": null,
        "hasPreviewImage": false
      },
      "actions": { "@id": "http://localhost:3000/events/@actions" },
      "breadcrumbs": { "@id": "http://localhost:3000/events/@breadcrumbs" },
      "navigation": { "@id": "http://localhost:3000/events/@navigation" },
      "navroot": { "@id": "http://localhost:3000/events/@navroot" },
      "related": { "@id": "http://localhost:3000/events/@related" },
      "types": { "@id": "http://localhost:3000/events/@types" },
      "workflow": { "@id": "http://localhost:3000/events/@workflow" },
      "translations": { "@id": "http://localhost:3000/events/@translations" },
      "inherit": { "@id": "http://localhost:3000/events/@inherit" }
    },
    "@id": "http://localhost:3000/events/event-3",
    "@type": "Event",
    "id": "event-3",
    "created": "2026-04-23T16:17:13.000Z",
    "modified": "2026-04-23T16:17:13.000Z",
    "UID": "61420b8c-f766-459d-9409-f7da72db6615",
    "owner": "admin",
    "layout": "view",
    "is_folderish": true,
    "review_state": "private",
    "lock": { "locked": false, "stealable": true }
  }
}
```

### Update

An example of the `update` event, the catalog is expanded by default:

```json
{
  "method": "update",
  "path": "/events/event-3",
  "data": {
    "start": "2026-04-01T07:00:00.334Z",
    "title": "New Event 3",
    "blocks": {
      "5cea07ab-983b-4c86-aba1-6de06e0647c5": { "@type": "title" },
      "6632cf31-4816-4403-a34e-d9d91a60037d": { "@type": "slate" }
    },
    "open_end": false,
    "attendies": [],
    "whole_day": false,
    "relatedItems": [],
    "blocks_layout": {
      "items": [
        "5cea07ab-983b-4c86-aba1-6de06e0647c5",
        "6632cf31-4816-4403-a34e-d9d91a60037d"
      ]
    },
    "@components": {
      "catalog": {
        "@id": "http://localhost:3000/events/event-3/@catalog",
        "@type": "Event",
        "title": "New Event 3",
        "getId": "event-3",
        "Creator": "admin",
        "UID": "844890e6-6d78-49cf-bf5c-c66653b50182",
        "path": "/events/event-3",
        "Description": null,
        "Title": "Event 3",
        "Subject": null,
        "is_folderish": true,
        "exclude_from_nav": false,
        "Type": "Event",
        "id": "event-3",
        "portal_type": "Event",
        "review_state": "private",
        "modified": "2026-04-23T16:23:26.000Z",
        "Date": "2026-04-23T16:23:26.000Z",
        "expires": null,
        "created": "2026-04-23T16:23:26.000Z",
        "effective": null,
        "getObjSize": 353,
        "listCreators": ["admin"],
        "mime_type": null,
        "CreationDate": "2026-04-23T16:23:26.000Z",
        "EffectiveDate": null,
        "ExpirationDate": null,
        "ModificationDate": "2026-04-23T16:23:26.000Z",
        "image_field": "",
        "image_scales": {},
        "start": "2026-01-01T08:00:00.105Z",
        "end": null,
        "recurrence": null,
        "hasPreviewImage": false
      },
      "actions": { "@id": "http://localhost:3000/events/@actions" },
      "breadcrumbs": { "@id": "http://localhost:3000/events/@breadcrumbs" },
      "navigation": { "@id": "http://localhost:3000/events/@navigation" },
      "navroot": { "@id": "http://localhost:3000/events/@navroot" },
      "related": { "@id": "http://localhost:3000/events/@related" },
      "types": { "@id": "http://localhost:3000/events/@types" },
      "workflow": { "@id": "http://localhost:3000/events/@workflow" },
      "translations": { "@id": "http://localhost:3000/events/@translations" },
      "inherit": { "@id": "http://localhost:3000/events/@inherit" }
    },
    "@id": "http://localhost:3000/events/event-3",
    "@type": "Event",
    "id": "event-3",
    "created": "2026-04-23T16:17:13.000Z",
    "modified": "2026-04-23T16:17:13.000Z",
    "UID": "61420b8c-f766-459d-9409-f7da72db6615",
    "owner": "admin",
    "layout": "view",
    "is_folderish": true,
    "review_state": "private",
    "lock": { "locked": false, "stealable": true }
  }
}
```

### Delete

An example of the delete event:

```json
{
  "method": "delete",
  "path": "/events/event-1",
  "data": null
}
```

### Copy

An example of the copy event:

```json
{
  "method": "copy",
  "path": "/events/event-1",
  "data": {
    "target": "/news/event-1"
  }
}
```

### Move

An example of the move event:

```json
{
  "method": "move",
  "path": "/events/event-1",
  "data": {
    "target": "/news/event-1"
  }
}
```
