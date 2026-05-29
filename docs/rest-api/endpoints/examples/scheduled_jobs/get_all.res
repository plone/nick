HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "reindex-events",
    "title": "Reindex Events",
    "description": "Reindex all events",
    "action": "reindex",
    "params": {
      "type": "Event"
    },
    "schedule": "0 0 * * *"
  }
]