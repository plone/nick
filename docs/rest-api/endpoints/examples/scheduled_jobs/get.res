HTTP/1.1 200 OK
Content-Type: application/json

{
  "@id": "http://localhost:8080/@scheduled-jobs/reindex-events",
  "id": "reindex-events",
  "title": "Reindex Events",
  "description": "Reindex all events",
  "action": "reindex",
  "params": {
    "type": "Event"
  },
  "schedule": "0 0 * * *"
}